-- ============================================
-- COMPLETE DATABASE SETUP FOR KAHOOT ALTERNATIVE
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE CORE TABLES
-- ============================================

-- Quiz Sets Table (Enhanced)
create table if not exists public.quiz_sets (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    name text not null,
    description text,
    image_url text,
    user_id uuid references auth.users(id) on delete cascade on update cascade,
    is_public boolean default true not null,
    default_time_limit smallint default 20 not null,
    default_points smallint default 1000 not null,
    plays_count integer default 0 not null
);

-- Questions Table (Enhanced)
create table if not exists public.questions (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    body text not null,
    image_url text,
    "order" smallint not null,
    time_limit smallint default 20 not null,
    points smallint default 1000 not null,
    quiz_set_id uuid not null references quiz_sets(id) on delete cascade on update cascade
);

-- Choices Table
create table if not exists public.choices (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    question_id uuid not null references questions(id) on delete cascade on update cascade,
    body text not null,
    is_correct boolean default false not null
);

-- Games Table (Enhanced)
create table if not exists public.games (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    ended_at timestamp with time zone,
    current_question_sequence smallint default 0 not null,
    is_answer_revealed boolean default false not null,
    phase text default 'lobby' not null,
    quiz_set_id uuid not null references quiz_sets(id) on delete cascade on update cascade,
    host_user_id uuid default auth.uid() references auth.users(id) on delete set null on update cascade
);

-- Add constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_game_phase'
    ) THEN
        ALTER TABLE public.games ADD CONSTRAINT check_game_phase CHECK (phase in ('lobby', 'quiz', 'result'));
    END IF;
END $$;

-- Participants Table
create table if not exists public.participants (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    nickname text not null,
    game_id uuid not null references games(id) on delete cascade on update cascade,
    user_id uuid default auth.uid() not null references auth.users(id) on delete cascade on update cascade,
    unique (game_id, user_id)
);

-- Answers Table (Enhanced)
create table if not exists public.answers (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    participant_id uuid not null references public.participants(id) on delete cascade on update cascade,
    question_id uuid not null references public.questions(id) on delete cascade on update cascade,
    choice_id uuid references public.choices(id) on delete set null on update cascade,
    score smallint not null,
    time_taken smallint not null default 0,
    unique (participant_id, question_id)
);

-- User Profiles Table (New)
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    username text unique,
    full_name text,
    avatar_url text,
    bio text
);

-- ============================================
-- 2. CREATE VIEWS
-- ============================================

-- Game Results View
create or replace view game_results as
    select
        participants.id as participant_id,
        participants.nickname,
        sum(answers.score) total_score,
        games.id as game_id
    from games
    inner join quiz_sets on games.quiz_set_id = quiz_sets.id
    inner join questions on quiz_sets.id = questions.quiz_set_id
    inner join answers on questions.id = answers.question_id
    inner join participants on answers.participant_id = participants.id and games.id = participants.game_id
    group by games.id, participants.id;

-- Quiz Analytics View (New)
create or replace view quiz_analytics as
    select
        quiz_sets.id as quiz_set_id,
        quiz_sets.name as quiz_name,
        count(distinct games.id) as total_games,
        count(distinct participants.id) as total_players,
        avg((select sum(score) from answers where participant_id = participants.id)) as avg_score
    from quiz_sets
    left join games on quiz_sets.id = games.quiz_set_id
    left join participants on games.id = participants.game_id
    group by quiz_sets.id, quiz_sets.name;

-- Question Analytics View (New)
create or replace view question_analytics as
    select
        questions.id as question_id,
        questions.body,
        questions.quiz_set_id,
        count(answers.id) as total_answers,
        sum(case when choices.is_correct then 1 else 0 end) as correct_answers,
        round(
            (sum(case when choices.is_correct then 1 else 0 end)::decimal /
            nullif(count(answers.id), 0) * 100), 2
        ) as correct_percentage
    from questions
    left join answers on questions.id = answers.question_id
    left join choices on answers.choice_id = choices.id
    group by questions.id, questions.body, questions.quiz_set_id;

-- ============================================
-- 3. CREATE FUNCTIONS
-- ============================================

-- Function to add question with choices
create or replace function add_question (
  quiz_set_id uuid,
  body text,
  "order" int,
  choices json[], -- [{"body": "Answer", "is_correct": true}]
  image_url text default null,
  time_limit int default 20,
  points int default 1000
) returns uuid language plpgsql as $$
declare
  question_id uuid;
  choice json;
begin
  insert into questions(body, "order", quiz_set_id, image_url, time_limit, points)
  values (add_question.body, add_question."order", add_question.quiz_set_id, add_question.image_url, add_question.time_limit, add_question.points)
  returning id into question_id;

  foreach choice in array choices
  loop
    insert into public.choices
        (question_id, body, is_correct)
        values (question_id, choice->>'body', (choice->>'is_correct')::boolean);
  end loop;

  return question_id;
end;
$$ security invoker;

-- Function to duplicate quiz
create or replace function duplicate_quiz(original_quiz_id uuid, new_name text)
returns uuid language plpgsql as $$
declare
  new_quiz_id uuid;
  question_record record;
  new_question_id uuid;
  choice_record record;
begin
  -- Create new quiz set
  insert into quiz_sets (name, description, image_url, user_id, is_public, default_time_limit, default_points)
  select new_name, description, image_url, auth.uid(), is_public, default_time_limit, default_points
  from quiz_sets where id = original_quiz_id
  returning id into new_quiz_id;

  -- Copy questions
  for question_record in select * from questions where quiz_set_id = original_quiz_id order by "order"
  loop
    insert into questions (body, image_url, "order", time_limit, points, quiz_set_id)
    values (question_record.body, question_record.image_url, question_record."order", question_record.time_limit, question_record.points, new_quiz_id)
    returning id into new_question_id;

    -- Copy choices
    insert into choices (question_id, body, is_correct)
    select new_question_id, body, is_correct
    from choices where question_id = question_record.id;
  end loop;

  return new_quiz_id;
end;
$$ security invoker;

-- Function to increment plays count
create or replace function increment_plays_count()
returns trigger language plpgsql as $$
begin
  if new.phase = 'quiz' and old.phase = 'lobby' then
    update quiz_sets set plays_count = plays_count + 1 where id = new.quiz_set_id;
  end if;
  return new;
end;
$$;

-- Function to handle new user profile creation
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Trigger for plays count
drop trigger if exists on_game_start on games;
create trigger on_game_start
  after update on games
  for each row
  execute function increment_plays_count();

-- Trigger for new user profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Trigger for updated_at on quiz_sets
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_quiz_sets_updated_at on quiz_sets;
create trigger update_quiz_sets_updated_at
  before update on quiz_sets
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Quiz Sets RLS
alter table public.quiz_sets enable row level security;

drop policy if exists "Quiz sets are viewable by everyone" on public.quiz_sets;
create policy "Quiz sets are viewable by everyone"
  on public.quiz_sets for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "Users can create their own quiz sets" on public.quiz_sets;
create policy "Users can create their own quiz sets"
  on public.quiz_sets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own quiz sets" on public.quiz_sets;
create policy "Users can update their own quiz sets"
  on public.quiz_sets for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own quiz sets" on public.quiz_sets;
create policy "Users can delete their own quiz sets"
  on public.quiz_sets for delete
  using (auth.uid() = user_id);

-- Questions RLS
alter table public.questions enable row level security;

drop policy if exists "Questions are viewable by everyone" on public.questions;
create policy "Questions are viewable by everyone"
  on public.questions for select using (true);

drop policy if exists "Users can manage questions in their quiz sets" on public.questions;
create policy "Users can manage questions in their quiz sets"
  on public.questions for all
  using (
    exists (
      select 1 from quiz_sets
      where quiz_sets.id = questions.quiz_set_id
      and quiz_sets.user_id = auth.uid()
    )
  );

-- Choices RLS
alter table public.choices enable row level security;

drop policy if exists "Choices are viewable by everyone" on public.choices;
create policy "Choices are viewable by everyone"
  on public.choices for select using (true);

drop policy if exists "Users can manage choices in their questions" on public.choices;
create policy "Users can manage choices in their questions"
  on public.choices for all
  using (
    exists (
      select 1 from questions
      join quiz_sets on questions.quiz_set_id = quiz_sets.id
      where questions.id = choices.question_id
      and quiz_sets.user_id = auth.uid()
    )
  );

-- Games RLS
alter table public.games enable row level security;

drop policy if exists "Games are viewable by everyone" on public.games;
create policy "Games are viewable by everyone"
  on public.games for select using (true);

drop policy if exists "Host can start a game" on public.games;
create policy "Host can start a game"
  on public.games for insert
  with check (auth.uid() = host_user_id);

drop policy if exists "Host can update their games" on public.games;
create policy "Host can update their games"
  on public.games for update
  using (auth.uid() = host_user_id)
  with check (auth.uid() = host_user_id);

-- Participants RLS
alter table public.participants enable row level security;

drop policy if exists "Participants are viewable by everyone" on public.participants;
create policy "Participants are viewable by everyone"
  on public.participants for select using (true);

drop policy if exists "Participants can insert themselves" on public.participants;
create policy "Participants can insert themselves"
  on public.participants for insert
  with check (auth.uid() = user_id);

-- Answers RLS
alter table public.answers enable row level security;

drop policy if exists "Answers are viewable by everyone" on public.answers;
create policy "Answers are viewable by everyone"
  on public.answers for select using (true);

drop policy if exists "Participants can insert their own answers" on public.answers;
create policy "Participants can insert their own answers"
  on public.answers for insert
  with check (true);

-- Profiles RLS
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- 6. ENABLE REALTIME
-- ============================================

alter publication supabase_realtime add table games;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table answers;

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================

create index if not exists idx_quiz_sets_user_id on quiz_sets(user_id);
create index if not exists idx_questions_quiz_set_id on questions(quiz_set_id);
create index if not exists idx_questions_order on questions("order");
create index if not exists idx_choices_question_id on choices(question_id);
create index if not exists idx_games_quiz_set_id on games(quiz_set_id);
create index if not exists idx_games_host_user_id on games(host_user_id);
create index if not exists idx_participants_game_id on participants(game_id);
create index if not exists idx_participants_user_id on participants(user_id);
create index if not exists idx_answers_participant_id on answers(participant_id);
create index if not exists idx_answers_question_id on answers(question_id);

-- ============================================
-- SETUP COMPLETE!
-- ============================================

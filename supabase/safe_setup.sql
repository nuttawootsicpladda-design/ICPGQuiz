-- ============================================
-- SAFE DATABASE SETUP FOR SUPAQUIZ
-- This script safely adds new columns and features
-- without breaking existing tables
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add columns to quiz_sets if they don't exist
DO $$
BEGIN
    -- Add updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'updated_at') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN updated_at timestamp with time zone default now() not null;
    END IF;

    -- Add image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'image_url') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN image_url text;
    END IF;

    -- Add user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'user_id') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN user_id uuid references auth.users(id) on delete cascade on update cascade;
    END IF;

    -- Add is_public
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'is_public') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN is_public boolean default true not null;
    END IF;

    -- Add default_time_limit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'default_time_limit') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN default_time_limit smallint default 20 not null;
    END IF;

    -- Add default_points
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'default_points') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN default_points smallint default 1000 not null;
    END IF;

    -- Add plays_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'plays_count') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN plays_count integer default 0 not null;
    END IF;

    -- Add theme_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'theme_id') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN theme_id text default 'classic';
    END IF;

    -- Add auto_advance_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'quiz_sets' AND column_name = 'auto_advance_time') THEN
        ALTER TABLE public.quiz_sets ADD COLUMN auto_advance_time smallint default 5;
    END IF;
END $$;

-- Add columns to questions if they don't exist
DO $$
BEGIN
    -- Add time_limit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'questions' AND column_name = 'time_limit') THEN
        ALTER TABLE public.questions ADD COLUMN time_limit smallint default 20 not null;
    END IF;

    -- Add points
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'questions' AND column_name = 'points') THEN
        ALTER TABLE public.questions ADD COLUMN points smallint default 1000 not null;
    END IF;
END $$;

-- Add columns to games if they don't exist
DO $$
BEGIN
    -- Add ended_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'games' AND column_name = 'ended_at') THEN
        ALTER TABLE public.games ADD COLUMN ended_at timestamp with time zone;
    END IF;

    -- Add host_user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'games' AND column_name = 'host_user_id') THEN
        ALTER TABLE public.games ADD COLUMN host_user_id uuid default auth.uid() references auth.users(id) on delete set null on update cascade;
    END IF;
END $$;

-- Add columns to participants if they don't exist
DO $$
BEGIN
    -- Add avatar_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'participants' AND column_name = 'avatar_id') THEN
        ALTER TABLE public.participants ADD COLUMN avatar_id text default 'cat';
    END IF;
END $$;

-- Add columns to answers if they don't exist
DO $$
BEGIN
    -- Add choice_id (from old migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'answers' AND column_name = 'choice_id') THEN
        ALTER TABLE public.answers ADD COLUMN choice_id uuid references public.choices(id) on delete set null on update cascade;
    END IF;

    -- Add time_taken
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'answers' AND column_name = 'time_taken') THEN
        ALTER TABLE public.answers ADD COLUMN time_taken smallint not null default 0;
    END IF;
END $$;

-- ============================================
-- 2. CREATE PROFILES TABLE
-- ============================================

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
-- 3. CREATE/UPDATE VIEWS
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

-- Quiz Analytics View
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

-- Question Analytics View
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
-- 4. CREATE/UPDATE FUNCTIONS
-- ============================================

-- Function to add question with choices (enhanced version)
create or replace function add_question (
  quiz_set_id uuid,
  body text,
  "order" int,
  choices json[],
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

-- Function for updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================
-- 5. CREATE TRIGGERS
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

-- Trigger for quiz_sets updated_at
drop trigger if exists update_quiz_sets_updated_at on quiz_sets;
create trigger update_quiz_sets_updated_at
  before update on quiz_sets
  for each row
  execute function update_updated_at_column();

-- Trigger for profiles updated_at
drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- ============================================
-- 6. UPDATE ROW LEVEL SECURITY (RLS)
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
-- 7. ENABLE REALTIME
-- ============================================

-- Note: This might fail if tables are already in publication, that's OK
DO $$
BEGIN
    -- Try to add games table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE games;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Table already in publication, ignore
    END;

    -- Try to add participants table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE participants;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;

    -- Try to add answers table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE answers;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- ============================================
-- 8. CREATE INDEXES
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

-- Return success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 All tables, views, functions, and policies are ready.';
    RAISE NOTICE '🚀 You can now start your application with: npm run dev';
END $$;

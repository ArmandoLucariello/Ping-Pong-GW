CREATE TYPE "public"."language" AS ENUM('en', 'it');--> statement-breakpoint
CREATE TYPE "public"."league_role" AS ENUM('player', 'admin');--> statement-breakpoint
CREATE TYPE "public"."match_event_type" AS ENUM('point', 'undo');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'awaiting_confirmation', 'disputed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('singles', 'doubles');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"league_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_by" uuid,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "league_members" (
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "league_role" DEFAULT 'player' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_members_league_id_user_id_pk" PRIMARY KEY("league_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"points_to_win" integer DEFAULT 11 NOT NULL,
	"best_of" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_points_to_win_check" CHECK ("leagues"."points_to_win" in (11, 21)),
	CONSTRAINT "leagues_best_of_check" CHECK ("leagues"."best_of" in (1, 3, 5))
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"match_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"type" "match_event_type" NOT NULL,
	"side" integer,
	"actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_events_match_id_sequence_pk" PRIMARY KEY("match_id","sequence"),
	CONSTRAINT "match_events_side_check" CHECK (("match_events"."type" = 'point' and "match_events"."side" is not null and "match_events"."side" in (1, 2)) or ("match_events"."type" = 'undo' and "match_events"."side" is null))
);
--> statement-breakpoint
CREATE TABLE "match_games" (
	"match_id" uuid NOT NULL,
	"game_number" integer NOT NULL,
	"side1_score" integer NOT NULL,
	"side2_score" integer NOT NULL,
	CONSTRAINT "match_games_match_id_game_number_pk" PRIMARY KEY("match_id","game_number"),
	CONSTRAINT "match_games_game_number_check" CHECK ("match_games"."game_number" >= 1),
	CONSTRAINT "match_games_scores_check" CHECK ("match_games"."side1_score" >= 0 and "match_games"."side2_score" >= 0)
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"side" integer NOT NULL,
	"position" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "match_players_match_id_user_id_pk" PRIMARY KEY("match_id","user_id"),
	CONSTRAINT "match_players_match_side_position_unique" UNIQUE("match_id","side","position"),
	CONSTRAINT "match_players_side_check" CHECK ("match_players"."side" in (1, 2)),
	CONSTRAINT "match_players_position_check" CHECK ("match_players"."position" in (1, 2))
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"play_day_id" uuid,
	"type" "match_type" NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"points_to_win" integer NOT NULL,
	"best_of" integer NOT NULL,
	"referee_id" uuid,
	"first_server_side" integer,
	"winner_side" integer,
	"created_by" uuid NOT NULL,
	"confirmed_by" uuid,
	"confirmed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_points_to_win_check" CHECK ("matches"."points_to_win" in (11, 21)),
	CONSTRAINT "matches_best_of_check" CHECK ("matches"."best_of" in (1, 3, 5)),
	CONSTRAINT "matches_first_server_side_check" CHECK ("matches"."first_server_side" in (1, 2)),
	CONSTRAINT "matches_winner_side_check" CHECK ("matches"."winner_side" in (1, 2)),
	CONSTRAINT "matches_completed_has_winner_check" CHECK ("matches"."status" <> 'completed' or "matches"."winner_side" is not null)
);
--> statement-breakpoint
CREATE TABLE "play_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"played_on" date NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "play_days_league_id_played_on_unique" UNIQUE("league_id","played_on")
);
--> statement-breakpoint
CREATE TABLE "rating_changes" (
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating_before" integer NOT NULL,
	"rating_after" integer NOT NULL,
	CONSTRAINT "rating_changes_match_id_user_id_pk" PRIMARY KEY("match_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "season_ratings" (
	"season_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"match_type" "match_type" NOT NULL,
	"rating" integer DEFAULT 1000 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "season_ratings_season_id_user_id_match_type_pk" PRIMARY KEY("season_id","user_id","match_type")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_league_id_starts_on_unique" UNIQUE("league_id","starts_on"),
	CONSTRAINT "seasons_dates_check" CHECK ("seasons"."ends_on" >= "seasons"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"display_name" text NOT NULL,
	"password_hash" text,
	"is_superuser" boolean DEFAULT false NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"anonymized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_games" ADD CONSTRAINT "match_games_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_play_day_id_play_days_id_fk" FOREIGN KEY ("play_day_id") REFERENCES "public"."play_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_days" ADD CONSTRAINT "play_days_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_days" ADD CONSTRAINT "play_days_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_ratings" ADD CONSTRAINT "season_ratings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_ratings" ADD CONSTRAINT "season_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "match_players_user_id_idx" ON "match_players" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "matches_season_id_idx" ON "matches" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");
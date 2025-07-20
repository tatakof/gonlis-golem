CREATE TABLE IF NOT EXISTS "UserPreferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"systemPrompt" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserPreferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

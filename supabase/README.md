# Supabase Schema Workflow

The historical migration files were intentionally reset. The linked database still keeps its remote migration history, so `supabase db pull` will refuse to create a new migration until that history is repaired.

Use a schema snapshot for now:

```bash
npm run db:snapshot
```

That command writes `supabase/schema.sql` from the linked project for the `public` and `private` schemas. It is read-only against the remote database, but it requires Docker because Supabase CLI runs `pg_dump` through a container.

Do not run `supabase migration repair` casually. It changes the remote migration history table and should only be done when you deliberately want to make a new migration baseline official.

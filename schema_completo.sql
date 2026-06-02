


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_user_condominio_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_condominio_id uuid;
BEGIN
  SELECT condominio_id INTO user_condominio_id
  FROM public.perfis
  WHERE id = auth.uid();

  RETURN user_condominio_id;
END;
$$;


ALTER FUNCTION "public"."get_user_condominio_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.perfis (
    id,
    nome,
    telefone,
    condominio_id,
    bloco,
    unidade
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.raw_user_meta_data->>'telefone',
    (NEW.raw_user_meta_data->>'condominio_id')::uuid,
    NEW.raw_user_meta_data->>'bloco',
    NEW.raw_user_meta_data->>'unidade'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sincronizar_anuncios_com_perfil"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update anuncios
  set
    bloco = NEW.bloco,
    unidade = NEW.unidade,
    condominio_id = NEW.condominio_id
  where
    usuario_id = NEW.id
    and status = 'ativo';
  return NEW;
end;
$$;


ALTER FUNCTION "public"."sincronizar_anuncios_com_perfil"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."anuncios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "categoria_id" "uuid",
    "preco" numeric(10,2),
    "usuario_id" "uuid",
    "condominio_id" "uuid",
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "expira_em" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "tipo_preco" "text" DEFAULT 'fixo'::"text" NOT NULL,
    "bloco" "text",
    "unidade" "text",
    CONSTRAINT "anuncios_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'pausado'::"text", 'encerrado'::"text"])))
);


ALTER TABLE "public"."anuncios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icone" "text",
    "ordem" integer DEFAULT 0,
    "ativo" boolean DEFAULT true,
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."condominios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "codigo" "text" NOT NULL,
    "endereco" "text",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."condominios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fotos_anuncio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "anuncio_id" "uuid",
    "url" "text" NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ordem_valida" CHECK ((("ordem" >= 0) AND ("ordem" <= 2)))
);


ALTER TABLE "public"."fotos_anuncio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfis" (
    "id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "telefone" "text",
    "condominio_id" "uuid",
    "bloco" "text",
    "unidade" "text",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."perfis" OWNER TO "postgres";


COMMENT ON COLUMN "public"."perfis"."telefone" IS 'WhatsApp do morador. Usado para contato entre compradores e vendedores.';



ALTER TABLE ONLY "public"."anuncios"
    ADD CONSTRAINT "anuncios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."condominios"
    ADD CONSTRAINT "condominios_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."condominios"
    ADD CONSTRAINT "condominios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fotos_anuncio"
    ADD CONSTRAINT "fotos_anuncio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "trigger_sincronizar_anuncios" AFTER UPDATE ON "public"."perfis" FOR EACH ROW WHEN ((("old"."bloco" IS DISTINCT FROM "new"."bloco") OR ("old"."unidade" IS DISTINCT FROM "new"."unidade") OR ("old"."condominio_id" IS DISTINCT FROM "new"."condominio_id"))) EXECUTE FUNCTION "public"."sincronizar_anuncios_com_perfil"();



ALTER TABLE ONLY "public"."anuncios"
    ADD CONSTRAINT "anuncios_autor_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."perfis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anuncios"
    ADD CONSTRAINT "anuncios_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id");



ALTER TABLE ONLY "public"."anuncios"
    ADD CONSTRAINT "anuncios_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominios"("id");



ALTER TABLE ONLY "public"."fotos_anuncio"
    ADD CONSTRAINT "fotos_anuncio_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominios"("id");



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anuncios publicos para leitura" ON "public"."anuncios" FOR SELECT USING (true);



CREATE POLICY "Categorias publicas para leitura" ON "public"."categorias" FOR SELECT USING (true);



CREATE POLICY "Fotos de anuncios publicas para leitura" ON "public"."fotos_anuncio" FOR SELECT USING (true);



CREATE POLICY "Perfis publicos para leitura" ON "public"."perfis" FOR SELECT USING (true);



ALTER TABLE "public"."anuncios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anuncios_delete" ON "public"."anuncios" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "anuncios_insert" ON "public"."anuncios" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "anuncios_select" ON "public"."anuncios" FOR SELECT TO "authenticated" USING ((("condominio_id" = ( SELECT "perfis"."condominio_id"
   FROM "public"."perfis"
  WHERE ("perfis"."id" = "auth"."uid"()))) OR ("usuario_id" = "auth"."uid"())));



CREATE POLICY "anuncios_select_publico" ON "public"."anuncios" FOR SELECT TO "anon" USING (("status" = 'ativo'::"text"));



CREATE POLICY "anuncios_update" ON "public"."anuncios" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias_select" ON "public"."categorias" FOR SELECT TO "authenticated", "anon" USING (("ativo" = true));



ALTER TABLE "public"."condominios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "condominios_select" ON "public"."condominios" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."fotos_anuncio" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fotos_delete" ON "public"."fotos_anuncio" FOR DELETE TO "authenticated" USING (("anuncio_id" IN ( SELECT "anuncios"."id"
   FROM "public"."anuncios"
  WHERE ("anuncios"."usuario_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "fotos_insert" ON "public"."fotos_anuncio" FOR INSERT TO "authenticated" WITH CHECK (("anuncio_id" IN ( SELECT "anuncios"."id"
   FROM "public"."anuncios"
  WHERE ("anuncios"."usuario_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "fotos_select" ON "public"."fotos_anuncio" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."perfis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "perfis_insert" ON "public"."perfis" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "perfis_select" ON "public"."perfis" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") OR ("condominio_id" = "public"."get_user_condominio_id"())));



CREATE POLICY "perfis_update" ON "public"."perfis" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_user_condominio_id"() TO "authenticated";


















GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."anuncios" TO "anon";
GRANT ALL ON TABLE "public"."anuncios" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."anuncios" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."categorias" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."categorias" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."categorias" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."condominios" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."condominios" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."condominios" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."fotos_anuncio" TO "anon";
GRANT ALL ON TABLE "public"."fotos_anuncio" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."fotos_anuncio" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."perfis" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."perfis" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."perfis" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";




































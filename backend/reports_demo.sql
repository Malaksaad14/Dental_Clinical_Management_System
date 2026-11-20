--
-- PostgreSQL database dump
--

\restrict 9drmGbohx5Q7TeiC1rmyMQFX7PotNyr3QuCsYAcTj1F8TUvHuvPct41hUJKVcYu

-- Dumped from database version 19.0
-- Dumped by pg_dump version 19.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: reports_demo; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA reports_demo;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: reports_demo; Owner: -
--

CREATE TABLE reports_demo.appointments (
    id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    status text NOT NULL,
    CONSTRAINT appointments_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))
);


--
-- Name: patients; Type: TABLE; Schema: reports_demo; Owner: -
--

CREATE TABLE reports_demo.patients (
    id integer NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: reports_demo; Owner: -
--

CREATE TABLE reports_demo.payments (
    id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_at timestamp without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: reports_demo; Owner: -
--

CREATE TABLE reports_demo.users (
    id integer NOT NULL,
    role text NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: reports_demo; Owner: -
--

COPY reports_demo.appointments (id, start_time, status) FROM stdin;
1	2026-11-20 09:00:00	completed
2	2026-11-20 10:00:00	completed
3	2026-11-20 11:00:00	no_show
4	2026-11-21 09:00:00	scheduled
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: reports_demo; Owner: -
--

COPY reports_demo.patients (id, user_id) FROM stdin;
1	1
2	2
3	4
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: reports_demo; Owner: -
--

COPY reports_demo.payments (id, amount, paid_at) FROM stdin;
1	400.00	2026-11-20 09:30:00
2	250.50	2026-11-20 12:15:00
3	300.00	2026-11-21 10:00:00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: reports_demo; Owner: -
--

COPY reports_demo.users (id, role, created_at) FROM stdin;
1	patient	2026-11-20 08:00:00
2	patient	2026-11-20 11:30:00
3	clinical_staff	2026-11-20 12:00:00
4	patient	2026-11-21 09:00:00
\.


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: reports_demo; Owner: -
--

ALTER TABLE ONLY reports_demo.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: reports_demo; Owner: -
--

ALTER TABLE ONLY reports_demo.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: patients patients_user_id_key; Type: CONSTRAINT; Schema: reports_demo; Owner: -
--

ALTER TABLE ONLY reports_demo.patients
    ADD CONSTRAINT patients_user_id_key UNIQUE (user_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: reports_demo; Owner: -
--

ALTER TABLE ONLY reports_demo.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: reports_demo; Owner: -
--

ALTER TABLE ONLY reports_demo.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: reports_demo; Owner: -
--

ALTER TABLE ONLY reports_demo.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES reports_demo.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 9drmGbohx5Q7TeiC1rmyMQFX7PotNyr3QuCsYAcTj1F8TUvHuvPct41hUJKVcYu


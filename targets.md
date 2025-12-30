# 🧠 AI Project Management Platform — Założenia Projektu

## 1️⃣ Cel projektu

Stworzenie **nowoczesnego systemu zarządzania projektami IT**, zaprojektowanego **od zera pod zespoły techniczne**, z silnym naciskiem na **automatyczne wsparcie przez AI** (planowanie, kontrola jakości, alerty ryzyka).

System ma **aktywnie pomagać zespołowi**, a nie być tylko pasywną tablicą zadań.

---

## 2️⃣ Grupa docelowa

* zespoły **software engineering / IT**
* startupy, software house’y, zespoły produktowe
* developerzy, tech leadzi, PM-owie

Projekt **nie jest** ogólnym narzędziem typu “dla każdego”, tylko:

> **PM tool zrozumiały dla developerów**

---

## 3️⃣ Kluczowe funkcjonalności

### 👥 Użytkownicy i dostęp

* logowanie i onboarding przez **konto GitHub**
* integracja z repozytoriami i organizacjami
* role i uprawnienia (Owner, Admin, PM, Dev, Reviewer)

---

### 📋 Zarządzanie projektami

* projekty, epiki, zadania, podzadania
* **Kanban (Trello-like)** z drag & drop
* **Gantt chart** (zależności, timeline)
* **milestones** i krytyczna ścieżka
* historia zmian i audyt

---

### 🧠 AI jako aktywny uczestnik projektu

AI nie tylko “odpowiada”, ale:

* **automatycznie rozbija epiki/feature’y na zadania**
* sugeruje zależności, role i milestone
* ocenia ryzyko i ważność zadań
* wykrywa niespójności (“coś się nie klei”)

---

### 🔍 AI Review & Quality Gates

* AI recenzuje wykonane zadania i PR-y:

    * zgodność z opisem i Definition of Done
    * brakujące testy / edge case’y
    * potencjalne błędy logiczne
* integracja z GitHub PR (webhooki)
* wyniki w systemie + opcjonalnie komentarze w PR

---

### 🚨 Alerty i sygnały ryzyka

System automatycznie informuje, gdy:

* zadanie zamknięto bez spełnienia kryteriów
* zmiany wpływają na krytyczną ścieżkę
* projekt zaczyna się opóźniać
* jakość rozwiązania jest niewystarczająca
* jakieś zadanie jest **ważniejsze niż się wydaje**

---

## 4️⃣ Architektura techniczna (high-level)

### Frontend

* Next.js (React, App Router)
* nowoczesny UI (Kanban, Gantt, dashboardy)
* realtime updates (statusy, komentarze, alerty)

### Backend

* API + logika domenowa (projekty, zadania, role)
* integracja GitHub (OAuth + GitHub App)
* event-driven workflow

### AI Layer

* osobny serwis AI
* task breakdown, review, risk analysis
* kontekst projektowy (RAG / pamięć projektu)

### Infrastruktura

* monorepo (pnpm workspaces)
* Postgres (source of truth)
* Redis (cache, kolejki)
* Docker + CI/CD

---

## 5️⃣ Założenia architektoniczne

* **monorepo** (apps + shared packages)
* **AI jako core feature**, nie dodatek
* **skalowalność funkcjonalna** (łatwe dodawanie kolejnych AI capabilities)
* **developer-first UX**
* jasne granice między:

    * UI
    * logiką biznesową
    * AI orchestration

---

## 6️⃣ Zakres MVP

MVP koncentruje się na:

* logowaniu przez GitHub
* tworzeniu projektów i zadań
* Kanban + Gantt
* AI task breakdown
* AI review zadań
* podstawowych alertach jakości i ryzyka

---

## 7️⃣ Wizja długoterminowa

W przyszłości system może ewoluować w:

* **AI Project Managera**
* automatyczne roadmapy i planowanie sprintów
* inteligentne przydzielanie zasobów
* integracje (Slack, Jira, GitLab)
* enterprise-ready (SSO, SOC2, audyt)


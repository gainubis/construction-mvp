# Project Overview

This project is a web-based construction project management MVP designed as a realistic B2B SaaS application.

The platform is intended for:
- admins
- foremen
- engineers
- workers

Its purpose is to help manage repair and construction workflows, daily inspection, safety control, reporting, planning, and stage closure.

---

# Core Product Modules

## 1. Projects
- create project
- list of objects
- upload floor plan
- assign responsible users

## 2. Stages
- create and manage stages
- deadlines
- responsible person
- statuses
- progress

## 3. Daily Control / Reports
- upload stage photos
- choose checklist
- fill inspection data
- generate AI report
- store report history

## 4. Safety
- register safety violation
- select violation type
- assign worker
- notify foreman
- show incident feed

## 5. AI Micro-Lessons
- generate a short safety lesson for worker
- explain the violation
- explain why dangerous
- show prevention steps
- include one short check question

## 6. AR-lite Planning
- upload wall photo
- place markers:
  - socket
  - pipe
  - switch
  - light point
- drag markers
- save coordinates

## 7. Acts / Stage Completion
- final review of stage
- digital signature
- generate PDF act
- save act
- update project progress

## 8. Dashboard
- metrics
- active projects
- stage progress
- recent reports
- recent safety incidents
- upcoming deadlines

---

# User Roles

## Admin
- full project access
- can manage users, projects, stages

## Foreman
- monitors work progress
- receives violation notifications
- reviews reports

## Engineer
- validates and closes stages
- signs acts

## Worker
- uploads photos if needed
- receives micro-lessons
- sees assigned items

---

# Main User Flows

## Flow 1: Project Start
1. create a project
2. upload floor plan
3. define stages
4. assign responsible users

## Flow 2: Daily Control
1. open stage
2. upload photos
3. choose checklist
4. submit inspection
5. generate AI report

## Flow 3: Safety Violation
1. create violation
2. select type
3. assign worker
4. notify foreman
5. generate AI micro-lesson

## Flow 4: AR-lite Planning
1. upload wall photo
2. add markers
3. move markers
4. save layout

## Flow 5: Stage Completion
1. open final review
2. confirm results
3. sign act
4. generate PDF
5. update dashboard progress

---

# Required Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth + Database + Storage)
- OpenAI API (server-side only)

---

# Engineering Requirements

- modular code structure
- reusable components
- production-style architecture
- responsive interface
- role-based access control
- loading states
- empty states
- error states
- proper form validation
- no API keys on client side

---

# AI Requirements

## AI Report Generation
Input:
- project name
- stage name
- checklist data
- inspector comments
- optional issues
- number of uploaded photos

Output:
- short summary
- identified issues
- recommendations
- stage health
- suggested next action

## AI Micro-Lesson Generation
Input:
- violation type
- worker role
- context
- severity
- comment

Output:
- what was violated
- why dangerous
- how to do it correctly
- preventive checklist
- short knowledge-check question

---

# MVP Goal

Build a realistic demo-ready web application that:
- feels like a real SaaS product
- can be shown at a defense/demo/investor meeting
- supports end-to-end product scenarios
- can later become a startup foundation
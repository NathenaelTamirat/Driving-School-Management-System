# Architecture Introduction

## Document Metadata

- **Last Updated:** June 25, 2026
- **Architecture Pattern:** Modular Monolith

## System Summary

The system utilizes a Modular Monolith architecture pattern featuring a Ruby on Rails backend API, a Next.js frontend, and a PostgreSQL database. The domain logic is structured into dedicated service modules with clear logical boundaries while maintaining a single deployment unit.

## Architectural Choice: Modular Monolith

The selection of the Modular Monolith pattern is based on specific operational advantages and understood trade offs.

### Advantages

- **Simplicity:** Provides a single deployment unit without the complexities of a distributed system
- **Developer Experience:** Facilitates easier local development and debugging workflows
- **Clear Boundaries:** Ensures domain modules are logically separated from one another
- **Future Proof:** Allows modules to be extracted into independent microservices later if necessary
- **Performance:** Eliminates network latency between individual modules

### Trade Offs

- **Boundary Discipline:** Demands strict developer discipline to maintain clean module boundaries
- **Monolithic Scaling:** All modules must scale together as they cannot be scaled independently
- **Availability Risk:** Presents a single point of failure which is mitigated through the use of database replicas

## System Scope and Core Modules

The system organizes its business logic into core domain modules within the single deployment framework:

- **Meklit Module:** Manages batch export logic, qualification validation, and 15 day cycle management
- **LMS Module:** Operates the theory training engine, practical training engine, daily attendance locking, and mock test triggers
- **ERTA Engine Module:** Orchestrates eligibility validation, exam booking orchestration, and a penalty system involving 300 ETB plus a 5 day remedial period
- **Finance Module:** Tracks milestone one and milestone two, the pricing service, and the payroll calculator
- **Graduation Module:** Coordinates the dossier compiler and the file transfer service to Kifle Ketema

## Initial Target Load and Scaling Context

The initial design phase accommodates the following baseline metrics:

- **Target Load:** 50 to 200 students per year
- **Concurrent Users:** Fewer than 50 users
- **Server Infrastructure:** A single server is sufficient to support the target market

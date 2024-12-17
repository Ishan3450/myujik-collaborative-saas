# **Myujik - Collaborate Streaming**

I developed a real-time music streaming platform where users can create a stream room, invite others to join, and collaborate for the perfect playlist. Participants can suggest songs by sharing YouTube links and upvote their favorite additions. The queue dynamically updates based on upvotes, ensuring that the most popular songs rise to the top. The stream owner has the ability to play songs in the order of their popularity, ensuring a collaborative and engaging listening experience. All interactions and updates happen in real-time using WebSockets, providing a seamless and interactive user experience.

## **Demo**
### Version 2
https://github.com/user-attachments/assets/b71b604d-a9f1-41b6-929c-acf75ffbc839


### Version 1
https://github.com/user-attachments/assets/61db59ab-56d3-4c6c-a9ba-544fd5542d7c


## **Table of Contents**

- [**Myujik - Collaborate Streaming**](#myujik---collaborate-streaming)
  - [**Demo**](#demo)
    - [Version 2](#version-2)
    - [Version 1](#version-1)
  - [**Table of Contents**](#table-of-contents)
  - [**Project Structure (Monorepo structure)**](#project-structure-monorepo-structure)
  - [**Technologies Used**](#technologies-used)
    - [**Frontend**](#frontend)
  - [**Installation**](#installation)
    - [**Cloning the Repository**](#cloning-the-repository)
    - [**PackagesInstallation**](#packagesinstallation)
    - [**Environment Variables**](#environment-variables)
  - [**Usage**](#usage)
    - [**Accessing the Application**](#accessing-the-application)
  - [**Contact Information**](#contact-information)

---

## **Project Structure (Monorepo structure)**

```plaintext
./
 │
 ├── apps/
 │   │
 │   ├── frontend/              # Frontend in NextJS
 │   └── websocket/             # Websocket Code
 │
 ├── demo/                      # Version wise demos
 │
 └── packages/
     │
     ├── db/
     │    ├── prisma/            # Prisma Model and Migrations
     │    │   ├── migrations/    # Models' migrations
     │    │   └── schema.prisma  # File defining the models of the database
     │    │
     │    └── index.ts           # Prisma Singleton Class
     │
     └── redis-client/          # Redis cache
         │
         └── index.ts           # Redis Singleton Class
```

---

## **Technologies Used**

### **Frontend**

- [Next.js](https://nextjs.org/) for full stack.
- [Tailwind CSS](https://tailwindcss.com/) for styling.
- [Shadcn/io](https://ui.shadcn.com/) for ui components.
- [Next Auth](https://next-auth.js.org/) for in-house authentication.
- [TypeScript](https://www.typescriptlang.org/) for strict type checking.
- [Turborepo](https://turbo.build/) for mono repo and system build orchestrator.
- [WS](https://www.npmjs.com/package/ws) for websocket communication.
- [Prisma](https://www.prisma.io/) as ORM with PostgreSQL database.  
- [Redis](https://redis.io/) as cache.
---

## **Installation**

### **Cloning the Repository**

```bash
git clone https://github.com/Ishan3450/myujik-collaborative-saas
```

### **PackagesInstallation**

```bash
cd /apps/websocket
npm install
```

### **Environment Variables**

- `.env.example` files are there wherever needed in the folder.

---

## **Usage**

- In the root folder run the command:
  
```bash
turbo build
```
or
```bash
npm run dev
```


### **Accessing the Application**

- Default Websocket Port: `ws://localhost:8080`.
- Default Frontend Port: `http://localhost:3000`.

---

## **Contact Information**

For any inquiries or feedback, feel free to reach out.

- LinkedIn: [Ishan Jagani](https://www.linkedin.com/in/ishanjagani/)
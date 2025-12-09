const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000", // Frontend dev server URL
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      // implement node event listeners here if needed
    },
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});


/// <reference types="cypress" />


/// <reference types="cypress" />

describe("Todo Application E2E Tests", () => {
  const apiUrl = "http://localhost:5000";        // adjust if your backend serves elsewhere
  const frontendBase = "/";                      // adjust if your frontend serves at subpath

  beforeEach(() => {
    // Clear/reset DB before each test — requires backend support
    cy.request("POST", `${apiUrl}/test/reset`);
    cy.visit(frontendBase);
  });

  it("loads UI: form and empty task list", () => {
    cy.get("input[placeholder='Project Proposal']").should("exist");
    cy.get("input[placeholder='Write the first draft']").should("exist");
    cy.get("button").contains("Add").should("exist");
    cy.get("[data-cy=task-item]").should("have.length", 0);
  });

  it("user can create a new task", () => {
    cy.intercept("POST", "/tasks").as("addTask");

    cy.get("input[placeholder='Project Proposal']").type("New Task");
    cy.get("input[placeholder='Write the first draft']").type("Task Description");
    cy.get("button").contains("Add").click();
    cy.wait("@addTask");

    cy.get("[data-cy=task-item]").should("have.length", 1);
    cy.get("[data-cy=task-item]").first().within(() => {
      cy.contains("New Task").should("exist");
      cy.contains("Task Description").should("exist");
      cy.get("button").contains("Done").should("exist");
    });
  });

  it("form validation blocks submission if fields empty", () => {
    cy.get("button").contains("Add").click();
    cy.get("[data-cy=task-item]").should("have.length", 0);
  });

  it("shows at most 5 tasks — newest first", () => {
    cy.intercept("POST", "/tasks").as("addTask");

    for (let i = 1; i <= 10; i++) {
      cy.get("input[placeholder='Project Proposal']").clear().type(`Task ${i}`);
      cy.get("input[placeholder='Write the first draft']").clear().type(`Desc ${i}`);
      cy.get("button").contains("Add").click();
      cy.wait("@addTask");
    }

    cy.get("[data-cy=task-item]").should("have.length", 5);
    cy.get("[data-cy=task-item]").first().contains("Task 10");
    cy.get("[data-cy=task-item]").last().contains("Task 6");
  });

  it("marking task as done removes it from UI", () => {
    cy.intercept("POST", "/tasks").as("addTask");
    cy.intercept("PUT", "/tasks/*/done").as("markDone");

    cy.get("input[placeholder='Project Proposal']").type("Complete Me");
    cy.get("input[placeholder='Write the first draft']").type("Desc");
    cy.get("button").contains("Add").click();
    cy.wait("@addTask");

    cy.get("[data-cy=task-item]").first().within(() => {
      cy.contains("Complete Me");
      cy.get("button").contains("Done").click();
    });

    cy.wait("@markDone");
    cy.get("[data-cy=task-item]").should("have.length", 0);
  });

  it("completed task does not return after reload", () => {
    cy.intercept("POST", "/tasks").as("addTask");
    cy.intercept("PUT", "/tasks/*/done").as("markDone");

    cy.get("input[placeholder='Project Proposal']").type("Task Done");
    cy.get("input[placeholder='Write the first draft']").type("Desc");
    cy.get("button").contains("Add").click();
    cy.wait("@addTask");

    cy.get("[data-cy=task-item]").first().within(() => {
      cy.get("button").contains("Done").click();
    });
    cy.wait("@markDone");

    cy.reload();
    cy.get("[data-cy=task-item]").should("have.length", 0);
  });

  it("backend failure shows error message to user", () => {
    // Simulate failure
    cy.intercept("POST", "/tasks", { statusCode: 500 }).as("postFail");

    cy.get("input[placeholder='Project Proposal']").type("Fail Task");
    cy.get("input[placeholder='Write the first draft']").type("Desc");
    cy.get("button").contains("Add").click();
    cy.wait("@postFail");

    cy.get("[data-cy=error-message]").should("exist");
  });

  it("tasks render newest-first order", () => {
    cy.intercept("POST", "/tasks").as("addTask");

    cy.get("input[placeholder='Project Proposal']").type("Old Task");
    cy.get("input[placeholder='Write the first draft']").type("Old Desc");
    cy.get("button").contains("Add").click();
    cy.wait("@addTask");

    cy.get("input[placeholder='Project Proposal']").clear().type("New Task");
    cy.get("input[placeholder='Write the first draft']").clear().type("New Desc");
    cy.get("button").contains("Add").click();
    cy.wait("@addTask");

    cy.get("[data-cy=task-item]").first().contains("New Task");
  });

  it("form clears after successful submission", () => {
    cy.intercept("POST", "/tasks").as("addTask");

    cy.get("input[placeholder='Project Proposal']").type("Clear Test");
    cy.get("input[placeholder='Write the first draft']").type("Desc");
    cy.get("button").contains("Add").click();
    cy.wait("@addTask");

    cy.get("input[placeholder='Project Proposal']").should("have.value", "");
    cy.get("input[placeholder='Write the first draft']").should("have.value", "");
  });

  it("state persists after page reload", () => {
    cy.intercept("POST", "/tasks").as("addTask");

    cy.get("input[placeholder='Project Proposal']").type("Persistent Task");
    cy.get("input[placeholder='Write the first draft']").type("Desc");
    cy.get("button").contains("Add").click();
    cy.wait("@addTask");

    cy.reload();
    cy.get("[data-cy=task-item]").should("contain", "Persistent Task");
  });
});

const TICKET_PRICE = 500_000;
const MAX_QUANTITY = 3;
const COOLDOWN_SECONDS = 5;

const elements = {
  scenario: document.getElementById("scenario"),
  availableAfter: document.getElementById("available-after"),
  resetButton: document.getElementById("reset-button"),

  ticketSection: document.getElementById("ticket-section"),
  availabilityBadge: document.getElementById("availability-badge"),

  refreshButton: document.getElementById("refresh-button"),
  cooldownMessage: document.getElementById("cooldown-message"),
  checkCounter: document.getElementById("check-counter"),

  purchaseControls: document.getElementById("purchase-controls"),
  quantity: document.getElementById("quantity"),
  orderButton: document.getElementById("order-button"),

  agreementModal: document.getElementById("agreement-modal"),
  agreementCheckbox: document.getElementById("agreement-checkbox"),
  acceptAgreement: document.getElementById("accept-agreement"),
  cancelAgreement: document.getElementById("cancel-agreement"),

  checkoutSection: document.getElementById("checkout-section"),
  checkoutQuantity: document.getElementById("checkout-quantity"),
  checkoutTotal: document.getElementById("checkout-total"),
  backButton: document.getElementById("back-button"),

  logs: document.getElementById("simulator-logs"),
};

const state = {
  scenario: "A",
  availableAfterChecks: 3,
  availabilityChecks: 0,
  available: false,
  selectedQuantity: 0,
  cooldownEndsAt: 0,
  cooldownTimer: null,
  checkout: false,
};

function log(message) {
  const timestamp = new Date().toLocaleTimeString("id-ID");

  const entry = document.createElement("div");

  entry.textContent = `[${timestamp}] ${message}`;

  elements.logs.appendChild(entry);

  elements.logs.scrollTop = elements.logs.scrollHeight;

  console.log(`[Simulator] ${message}`);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function applyUrlConfiguration() {
  const params = new URLSearchParams(window.location.search);

  const scenario = params.get("scenario");

  if (scenario !== null) {
    const normalizedScenario = scenario.toUpperCase();

    if (["A", "B", "C"].includes(normalizedScenario)) {
      elements.scenario.value = normalizedScenario;
    } else {
      console.warn(
        `[Simulator] Invalid scenario: ${scenario}. Using default scenario.`,
      );
    }
  }

  const availableAfter = params.get("availableAfter");

  if (availableAfter !== null) {
    const parsedValue = Number(availableAfter);

    if (
      Number.isInteger(parsedValue) &&
      parsedValue >= 1 &&
      parsedValue <= 20
    ) {
      elements.availableAfter.value = String(parsedValue);
    }
  }
}

function readConfiguration() {
  state.scenario = elements.scenario.value;

  const configuredChecks = Number(elements.availableAfter.value);

  state.availableAfterChecks = Number.isInteger(configuredChecks)
    ? Math.min(20, Math.max(1, configuredChecks))
    : 3;

  elements.availableAfter.value = String(
    state.availableAfterChecks,
  );
}

function updateAvailabilityUI() {
  elements.availabilityBadge.textContent = state.available
    ? "Available"
    : "Unavailable";

  elements.availabilityBadge.className = state.available
    ? "status available"
    : "status unavailable";

  elements.purchaseControls.hidden = !state.available;

  elements.checkCounter.textContent =
    `Availability checks: ${state.availabilityChecks}`;
}

function updateOrderButton() {
  const validQuantity =
    Number.isInteger(state.selectedQuantity) &&
    state.selectedQuantity >= 1 &&
    state.selectedQuantity <= MAX_QUANTITY;

  elements.orderButton.disabled = !validQuantity;
}

function updateScenarioUI() {
  elements.orderButton.textContent =
    state.scenario === "C"
      ? "Pesan Sekarang"
      : "Order Now";
}

function stopCooldown() {
  if (state.cooldownTimer !== null) {
    clearInterval(state.cooldownTimer);
    state.cooldownTimer = null;
  }

  state.cooldownEndsAt = 0;
  elements.cooldownMessage.textContent = "";
  elements.refreshButton.disabled = false;
}

function updateCooldown() {
  const remainingMilliseconds =
    state.cooldownEndsAt - Date.now();

  const remainingSeconds = Math.max(
    0,
    Math.ceil(remainingMilliseconds / 1000),
  );

  if (remainingSeconds === 0) {
    stopCooldown();

    log("Availability refresh is ready");

    return;
  }

  elements.refreshButton.disabled = true;

  elements.cooldownMessage.textContent =
    `Please wait ${remainingSeconds}s before refreshing again`;
}

function startCooldown() {
  stopCooldown();

  state.cooldownEndsAt =
    Date.now() + COOLDOWN_SECONDS * 1000;

  updateCooldown();

  state.cooldownTimer = setInterval(
    updateCooldown,
    200,
  );
}

function checkAvailability() {
  if (state.checkout) {
    return;
  }

  if (Date.now() < state.cooldownEndsAt) {
    log("Refresh ignored because cooldown is active");
    return;
  }

  if (state.available) {
    log("Tickets are already available");
    return;
  }

  state.availabilityChecks += 1;

  log(
    `Checking availability (${state.availabilityChecks}/${state.availableAfterChecks})`,
  );

  if (
    state.availabilityChecks >=
    state.availableAfterChecks
  ) {
    state.available = true;

    log("Festival Presale 2 tickets are available");
  } else {
    log("Tickets are not available yet");
  }

  updateAvailabilityUI();

  if (!state.available) {
    startCooldown();
  }
}

function selectQuantity() {
  const quantity = Number(elements.quantity.value);

  state.selectedQuantity =
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_QUANTITY
      ? quantity
      : 0;

  updateOrderButton();

  if (state.selectedQuantity > 0) {
    log(`Selected quantity: ${state.selectedQuantity}`);
  }
}

function showAgreement() {
  elements.agreementCheckbox.checked = false;
  elements.acceptAgreement.disabled = true;

  elements.agreementModal.hidden = false;

  log("Agreement popup opened");
}

function closeAgreement() {
  elements.agreementModal.hidden = true;

  log("Agreement popup closed");
}

function openCheckout() {
  if (!state.available) {
    log("Checkout blocked: tickets unavailable");
    return;
  }

  if (
    state.selectedQuantity < 1 ||
    state.selectedQuantity > MAX_QUANTITY
  ) {
    log("Checkout blocked: invalid quantity");
    return;
  }

  state.checkout = true;

  elements.ticketSection.hidden = true;
  elements.checkoutSection.hidden = false;

  elements.checkoutQuantity.textContent =
    String(state.selectedQuantity);

  elements.checkoutTotal.textContent = formatCurrency(
    state.selectedQuantity * TICKET_PRICE,
  );

  log("Navigated to mock checkout");
}

function placeOrder() {
  if (!state.available) {
    log("Order rejected: tickets unavailable");
    return;
  }

  if (
    !Number.isInteger(state.selectedQuantity) ||
    state.selectedQuantity < 1 ||
    state.selectedQuantity > MAX_QUANTITY
  ) {
    log("Order rejected: invalid quantity");
    return;
  }

  log(
    `Order requested: ${state.selectedQuantity} Festival Presale 2 tickets`,
  );

  if (state.scenario === "A") {
    showAgreement();
    return;
  }

  openCheckout();
}

function acceptAgreement() {
  if (!elements.agreementCheckbox.checked) {
    log("Agreement must be accepted");
    return;
  }

  closeAgreement();

  log("Agreement accepted");

  openCheckout();
}

function backToTickets() {
  state.checkout = false;

  elements.checkoutSection.hidden = true;
  elements.ticketSection.hidden = false;

  log("Returned to ticket selection");
}

function resetSimulator() {
  stopCooldown();

  readConfiguration();

  state.availabilityChecks = 0;
  state.available = false;
  state.selectedQuantity = 0;
  state.checkout = false;

  elements.quantity.value = "";
  elements.agreementCheckbox.checked = false;
  elements.agreementModal.hidden = true;

  elements.checkoutSection.hidden = true;
  elements.ticketSection.hidden = false;

  elements.logs.replaceChildren();

  updateAvailabilityUI();
  updateOrderButton();
  updateScenarioUI();

  log(`Simulator reset with Scenario ${state.scenario}`);
  log(
    `Tickets become available after ${state.availableAfterChecks} checks`,
  );
}

elements.refreshButton.addEventListener(
  "click",
  checkAvailability,
);

elements.quantity.addEventListener(
  "change",
  selectQuantity,
);

elements.orderButton.addEventListener(
  "click",
  placeOrder,
);

elements.agreementCheckbox.addEventListener(
  "change",
  () => {
    elements.acceptAgreement.disabled =
      !elements.agreementCheckbox.checked;
  },
);

elements.acceptAgreement.addEventListener(
  "click",
  acceptAgreement,
);

elements.cancelAgreement.addEventListener(
  "click",
  closeAgreement,
);

elements.backButton.addEventListener(
  "click",
  backToTickets,
);

elements.resetButton.addEventListener(
  "click",
  resetSimulator,
);

elements.scenario.addEventListener(
  "change",
  resetSimulator,
);

elements.availableAfter.addEventListener(
  "change",
  resetSimulator,
);

applyUrlConfiguration();
resetSimulator();
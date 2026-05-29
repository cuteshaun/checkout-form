import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { getOrders, saveOrder, clearOrders } from "./storage.js";
import {
  getTodayDateString,
  isValidEmail,
  isValidPhone,
  isValidCardNumber,
  isValidExpiration,
  isExpirationInPast,
  isValidCvv,
  maskCardNumber,
  formatPhone,
  formatCardNumber,
  formatExpiration,
  formatCvv,
  formatDiscountCode,
} from "./validation.js";

export default function App() {
  const [screen, setScreen] = useState("checkout");
  const [orders, setOrders] = useState(() => getOrders());

  const checkoutHeadingRef = useRef(null);
  const confirmationHeadingRef = useRef(null);

  // Move focus to the active screen's heading whenever the screen changes.
  useEffect(() => {
    const target =
      screen === "confirmation"
        ? confirmationHeadingRef.current
        : checkoutHeadingRef.current;
    if (target) target.focus();
  }, [screen]);

  function handleOrderSubmit(order) {
    const updated = saveOrder(order);
    setOrders(updated);
    setScreen("confirmation");
  }

  function handleBackToCheckout() {
    setScreen("checkout");
  }

  function handleClearOrders() {
    clearOrders();
    setOrders([]);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <a href="/" className="brand" aria-label="chaos-form">
            <span className="brand__mark">chaos</span>
            <span className="brand__dot">-</span>
            <span className="brand__rest">form</span>
          </a>
        </div>
      </header>

      <main className="app-main">
        {screen === "checkout" ? (
          <CheckoutScreen
            headingRef={checkoutHeadingRef}
            onSubmit={handleOrderSubmit}
          />
        ) : (
          <ConfirmationScreen
            headingRef={confirmationHeadingRef}
            orders={orders}
            onBack={handleBackToCheckout}
            onClear={handleClearOrders}
          />
        )}
      </main>
    </div>
  );
}

function CheckoutScreen({ headingRef, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
  } = useForm({
    mode: "onBlur",
  });

  const today = getTodayDateString();

  // Wrap register() so an input is reformatted on every change while staying
  // fully controlled by react-hook-form (no separate useState).
  function registerFormatted(name, rules, formatter) {
    const field = register(name, rules);
    return {
      ...field,
      onChange: (event) => {
        event.target.value = formatter(event.target.value);
        return field.onChange(event);
      },
    };
  }

  function onValid(data) {
    const order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      fullName: data.fullName,
      email: data.email.trim(),
      phone: data.phone,
      shippingAddress: data.shippingAddress,
      preferredDeliveryDate: data.preferredDeliveryDate,
      cardNumber: data.cardNumber,
      expiration: data.expiration,
      billingAddress: data.billingAddress,
      discountCode: data.discountCode,
      acceptTerms: data.acceptTerms,
      optInUpdates: data.optInUpdates,
    };
    onSubmit(order);
    reset();
  }

  // Ordered list of fields used to build the validation summary.
  const errorOrder = [
    ["fullName", "Full name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["shippingAddress", "Shipping address"],
    ["preferredDeliveryDate", "Preferred delivery date"],
    ["cardNumber", "Card number"],
    ["expiration", "Expiration"],
    ["cvv", "CVV"],
    ["billingAddress", "Billing address"],
    ["discountCode", "Discount code"],
    ["acceptTerms", "Accept terms and conditions"],
  ];
  const summaryItems = errorOrder.filter(([key]) => errors[key]);
  const showSummary = isSubmitted && summaryItems.length > 0;

  return (
    <section className="screen checkout" aria-labelledby="checkout-heading">
      <div className="screen__intro">
        <h1
          id="checkout-heading"
          className="screen__title"
          tabIndex={-1}
          ref={headingRef}
        >
          Secure checkout
        </h1>
        <p className="screen__subtitle">
          Review your details and complete your order. Fields marked with{" "}
          <span className="req-key">*</span> are required.
        </p>
      </div>

      <div
        className="summary-region"
        role="alert"
        aria-live="polite"
      >
        {showSummary && (
          <div className="summary">
            <p className="summary__title">
              Please fix {summaryItems.length}{" "}
              {summaryItems.length === 1 ? "issue" : "issues"} before
              continuing:
            </p>
            <ul className="summary__list">
              {summaryItems.map(([key, label]) => (
                <li key={key}>
                  <a href={`#field-${key}`}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form className="form" onSubmit={handleSubmit(onValid)} noValidate>
        {/* Customer information */}
        <section className="fieldset" role="group" aria-labelledby="group-customer">
          <h2 className="legend" id="group-customer">Customer information</h2>
          <p className="fieldset__hint">Tell us who this order is for.</p>

          <div className="grid">
            <Field className="grid__half" error={errors.fullName}>
              <label htmlFor="field-fullName">
                Full name <Req />
              </label>
              <input
                id="field-fullName"
                type="text"
                autoComplete="name"
                maxLength={60}
                aria-required="true"
                aria-invalid={errors.fullName ? "true" : undefined}
                aria-describedby={errors.fullName ? "error-fullName" : undefined}
                {...register("fullName", {
                  required: "Full name is required.",
                  validate: {
                    chars: (v) =>
                      /^[A-Za-z\s'-]+$/.test(v) ||
                      "Full name can only contain letters, spaces, hyphens, and apostrophes.",
                    minLen: (v) =>
                      v.trim().length >= 3 ||
                      "Full name must be at least 3 characters.",
                    maxLen: (v) =>
                      v.length <= 60 ||
                      "Full name must be 60 characters or less.",
                  },
                })}
              />
              <FieldError id="error-fullName" error={errors.fullName} />
            </Field>

            <Field className="grid__half" error={errors.email}>
              <label htmlFor="field-email">
                Email <Req />
              </label>
              <input
                id="field-email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-invalid={errors.email ? "true" : undefined}
                aria-describedby={errors.email ? "error-email" : undefined}
                {...register("email", {
                  required: "Email is required.",
                  validate: (value) =>
                    isValidEmail(value) || "Enter a valid email address.",
                })}
              />
              <FieldError id="error-email" error={errors.email} />
            </Field>
          </div>
        </section>

        {/* Contact */}
        <section className="fieldset" role="group" aria-labelledby="group-contact">
          <h2 className="legend" id="group-contact">Contact</h2>
          <p className="fieldset__hint">
            We&apos;ll only use this to reach you about your order.
          </p>

          <div className="grid">
            <Field className="grid__half" error={errors.phone}>
              <label htmlFor="field-phone">Phone</label>
              <input
                id="field-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={errors.phone ? "true" : undefined}
                aria-describedby={errors.phone ? "error-phone" : undefined}
                {...registerFormatted(
                  "phone",
                  {
                    validate: (v) =>
                      !v ||
                      isValidPhone(v) ||
                      "Enter a valid 10-digit US phone number.",
                  },
                  formatPhone
                )}
              />
              <FieldError id="error-phone" error={errors.phone} />
            </Field>
          </div>
        </section>

        {/* Shipping details */}
        <section className="fieldset" role="group" aria-labelledby="group-shipping">
          <h2 className="legend" id="group-shipping">Shipping details</h2>
          <p className="fieldset__hint">Where should we send your order?</p>

          <div className="grid">
            <Field className="grid__wide" error={errors.shippingAddress}>
              <label htmlFor="field-shippingAddress">
                Shipping address <Req />
              </label>
              <textarea
                id="field-shippingAddress"
                rows={3}
                autoComplete="shipping street-address"
                aria-required="true"
                aria-invalid={errors.shippingAddress ? "true" : undefined}
                aria-describedby={
                  errors.shippingAddress ? "error-shippingAddress" : undefined
                }
                {...register("shippingAddress", {
                  required: "Shipping address is required.",
                  validate: {
                    minLen: (v) =>
                      v.trim().length >= 8 ||
                      "Shipping address must be at least 8 characters.",
                    maxLen: (v) =>
                      v.length <= 120 ||
                      "Shipping address must be 120 characters or less.",
                  },
                })}
              />
              <FieldError
                id="error-shippingAddress"
                error={errors.shippingAddress}
              />
            </Field>

            <Field className="grid__half" error={errors.preferredDeliveryDate}>
              <label htmlFor="field-preferredDeliveryDate">
                Preferred delivery date <Req />
              </label>
              <input
                id="field-preferredDeliveryDate"
                type="date"
                min={today}
                aria-required="true"
                aria-invalid={
                  errors.preferredDeliveryDate ? "true" : undefined
                }
                aria-describedby={
                  errors.preferredDeliveryDate
                    ? "error-preferredDeliveryDate"
                    : undefined
                }
                {...register("preferredDeliveryDate", {
                  required: "Preferred delivery date is required.",
                  validate: (v) =>
                    !v ||
                    v >= today ||
                    "Delivery date cannot be in the past.",
                })}
              />
              <FieldError
                id="error-preferredDeliveryDate"
                error={errors.preferredDeliveryDate}
              />
            </Field>
          </div>
        </section>

        {/* Payment details */}
        <section className="fieldset" role="group" aria-labelledby="group-payment">
          <h2 className="legend" id="group-payment">Payment details</h2>
          <p className="fieldset__hint">All payment fields are required.</p>

          <div className="grid">
            <Field className="grid__wide" error={errors.cardNumber}>
              <label htmlFor="field-cardNumber">
                Card number <Req />
              </label>
              <input
                id="field-cardNumber"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={19}
                aria-required="true"
                aria-invalid={errors.cardNumber ? "true" : undefined}
                aria-describedby={
                  errors.cardNumber
                    ? "help-cardNumber error-cardNumber"
                    : "help-cardNumber"
                }
                {...registerFormatted(
                  "cardNumber",
                  {
                    required: "Card number is required.",
                    validate: (value) =>
                      isValidCardNumber(value) ||
                      "Card number must be exactly 16 digits.",
                  },
                  formatCardNumber
                )}
              />
              <p id="help-cardNumber" className="help">
                16 digits, grouped automatically, e.g. 4242 4242 4242 4242.
              </p>
              <FieldError id="error-cardNumber" error={errors.cardNumber} />
            </Field>

            <Field className="grid__half" error={errors.expiration}>
              <label htmlFor="field-expiration">
                Expiration <Req />
              </label>
              <input
                id="field-expiration"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
                aria-required="true"
                aria-invalid={errors.expiration ? "true" : undefined}
                aria-describedby={
                  errors.expiration
                    ? "help-expiration error-expiration"
                    : "help-expiration"
                }
                {...registerFormatted(
                  "expiration",
                  {
                    required: "Expiration date is required.",
                    validate: {
                      format: (value) =>
                        isValidExpiration(value) || "Use MM/YY format.",
                      notPast: (value) =>
                        !isExpirationInPast(value) ||
                        "Expiration date cannot be in the past.",
                    },
                  },
                  formatExpiration
                )}
              />
              <p id="help-expiration" className="help">
                Use MM/YY format.
              </p>
              <FieldError id="error-expiration" error={errors.expiration} />
            </Field>

            <Field className="grid__half" error={errors.cvv}>
              <label htmlFor="field-cvv">
                CVV <Req />
              </label>
              <input
                id="field-cvv"
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={3}
                aria-required="true"
                aria-invalid={errors.cvv ? "true" : undefined}
                aria-describedby={
                  errors.cvv ? "help-cvv error-cvv" : "help-cvv"
                }
                {...registerFormatted(
                  "cvv",
                  {
                    required: "CVV is required.",
                    validate: (value) =>
                      isValidCvv(value) || "CVV must be exactly 3 digits.",
                  },
                  formatCvv
                )}
              />
              <p id="help-cvv" className="help">
                3 digits, found on the back of your card.
              </p>
              <FieldError id="error-cvv" error={errors.cvv} />
            </Field>
          </div>
        </section>

        {/* Billing details */}
        <section className="fieldset" role="group" aria-labelledby="group-billing">
          <h2 className="legend" id="group-billing">Billing details</h2>
          <p className="fieldset__hint">The address tied to your card.</p>

          <div className="grid">
            <Field className="grid__wide" error={errors.billingAddress}>
              <label htmlFor="field-billingAddress">
                Billing address <Req />
              </label>
              <textarea
                id="field-billingAddress"
                rows={3}
                autoComplete="billing street-address"
                aria-required="true"
                aria-invalid={errors.billingAddress ? "true" : undefined}
                aria-describedby={
                  errors.billingAddress ? "error-billingAddress" : undefined
                }
                {...register("billingAddress", {
                  required: "Billing address is required.",
                  validate: {
                    minLen: (v) =>
                      v.trim().length >= 8 ||
                      "Billing address must be at least 8 characters.",
                    maxLen: (v) =>
                      v.length <= 120 ||
                      "Billing address must be 120 characters or less.",
                  },
                })}
              />
              <FieldError
                id="error-billingAddress"
                error={errors.billingAddress}
              />
            </Field>
          </div>
        </section>

        {/* Discounts and preferences */}
        <section className="fieldset" role="group" aria-labelledby="group-prefs">
          <h2 className="legend" id="group-prefs">Discounts and preferences</h2>
          <p className="fieldset__hint">Optional extras and your consent.</p>

          <div className="grid">
            <Field className="grid__half" error={errors.discountCode}>
              <label htmlFor="field-discountCode">Discount code</label>
              <input
                id="field-discountCode"
                type="text"
                autoComplete="off"
                aria-invalid={errors.discountCode ? "true" : undefined}
                aria-describedby={
                  errors.discountCode ? "error-discountCode" : undefined
                }
                {...registerFormatted(
                  "discountCode",
                  {
                    validate: {
                      maxLen: (v) =>
                        !v ||
                        v.length <= 25 ||
                        "Discount code must be 25 characters or less.",
                      chars: (v) =>
                        !v ||
                        /^[A-Z0-9-]+$/.test(v) ||
                        "Use only uppercase letters, numbers, and hyphens.",
                    },
                  },
                  formatDiscountCode
                )}
              />
              <FieldError id="error-discountCode" error={errors.discountCode} />
            </Field>

            <div className="grid__full checkboxes">
              <div
                className={
                  "checkbox-row" + (errors.acceptTerms ? " checkbox-row--error" : "")
                }
              >
                <input
                  id="field-acceptTerms"
                  type="checkbox"
                  aria-required="true"
                  aria-invalid={errors.acceptTerms ? "true" : undefined}
                  aria-describedby={
                    errors.acceptTerms ? "error-acceptTerms" : undefined
                  }
                  {...register("acceptTerms", {
                    required: "You must accept the terms and conditions.",
                  })}
                />
                <label htmlFor="field-acceptTerms">
                  Accept terms and conditions <Req />
                </label>
              </div>
              <FieldError id="error-acceptTerms" error={errors.acceptTerms} />

              <div className="checkbox-row">
                <input
                  id="field-optInUpdates"
                  type="checkbox"
                  {...register("optInUpdates")}
                />
                <label htmlFor="field-optInUpdates">
                  Opt in for updates from this company?
                </label>
              </div>
            </div>
          </div>
        </section>

        <div className="form__actions">
          <button type="submit" className="btn btn--primary">
            Place order
          </button>
        </div>
      </form>
    </section>
  );
}

function ConfirmationScreen({ headingRef, orders, onBack, onClear }) {
  const count = orders.length;

  return (
    <section className="screen confirmation" aria-labelledby="confirmation-heading">
      <div className="screen__intro">
        <h1
          id="confirmation-heading"
          className="screen__title"
          tabIndex={-1}
          ref={headingRef}
        >
          Order confirmation
        </h1>
        <p className="screen__subtitle">
          {count === 0
            ? "There are no saved orders yet."
            : `You have ${count} submitted ${
                count === 1 ? "order" : "orders"
              }.`}
        </p>
      </div>

      <div className="confirmation__actions">
        <button type="button" className="btn btn--primary" onClick={onBack}>
          Back to checkout
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onClear}
          disabled={count === 0}
        >
          Clear saved orders
        </button>
      </div>

      {count === 0 ? (
        <p className="empty">
          Submit the checkout form to see your orders appear here.
        </p>
      ) : (
        <ol className="orders">
          {orders.map((order, index) => (
            <li key={order.id}>
              <OrderCard order={order} index={count - index} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function OrderCard({ order, index }) {
  return (
    <article className="order-card">
      <header className="order-card__header">
        <h2 className="order-card__title">Order #{index}</h2>
        <p className="order-card__id">ID: {order.id}</p>
        <p className="order-card__date">{formatDate(order.createdAt)}</p>
      </header>

      <dl className="order-card__details">
        {order.fullName && (
          <Row label="Customer">{order.fullName}</Row>
        )}
        <Row label="Email">{order.email}</Row>
        {order.phone && <Row label="Phone">{formatPhone(order.phone)}</Row>}
        <Row label="Shipping address">
          <span className="pre">{order.shippingAddress}</span>
        </Row>
        <Row label="Preferred delivery date">
          {formatDeliveryDate(order.preferredDeliveryDate)}
        </Row>
        <Row label="Billing address">
          <span className="pre">{order.billingAddress}</span>
        </Row>
        {order.discountCode && (
          <Row label="Discount code">{order.discountCode}</Row>
        )}
        <Row label="Updates opt-in">
          {order.optInUpdates ? "Yes" : "No"}
        </Row>
        <Row label="Card number">
          <span className="mono">{maskCardNumber(order.cardNumber)}</span>
        </Row>
        <Row label="Expiration">{order.expiration}</Row>
      </dl>
    </article>
  );
}

function Row({ label, children }) {
  return (
    <div className="order-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/* ---------- Small presentational helpers ---------- */

function Field({ className = "", error, children }) {
  return (
    <div className={`field ${className}`.trim() + (error ? " field--error" : "")}>
      {children}
    </div>
  );
}

function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} className="field-error">
      {error.message}
    </p>
  );
}

function Req() {
  return (
    <span className="req" aria-hidden="true">
      *
    </span>
  );
}

/* ---------- Formatting ---------- */

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDeliveryDate(value) {
  if (!value) return "—";
  // value is a YYYY-MM-DD string from <input type="date">
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const axios = require("axios");
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const PLUNK_SEND_URL = "https://next-api.useplunk.com/v1/send";

class EmailService {
    constructor() {
        this.apiKey = process.env.PLUNK_API_KEY || null;
        this.from = process.env.PLUNK_FROM || null;

        if (!this.apiKey) {
            console.warn(
                "PLUNK_API_KEY environment variable not set. Email functionality will be limited."
            );
        }

        if (!this.from) {
            console.warn(
                "PLUNK_FROM environment variable not set. Plunk requires a verified sender address."
            );
        }
    }

    async sendEmail(to, subject, template, data) {
        try {
            // Read and compile template
            // __dirname is this file's folder (src/services), so go up one level into templates.
            // This is stable no matter which directory node is launched from.
            const templatePath = path.join(__dirname, "..", "templates", `${template}.hbs`);

            if (!existsSync(templatePath)) {
                throw new Error(`Template not found: ${templatePath}`);
            }

            const templateContent = readFileSync(templatePath, "utf8");

            const html = Handlebars.compile(templateContent)({
                ...data,
                subject,
                companyName: "Zeketo Portfolio",
                year: new Date().getFullYear(),
                supportEmail: "[EMAIL_ADDRESS]",
            });

            // If no API key, log email instead of sending (dev mode)
            if (!this.apiKey) {
                return this.logDevEmail(to, subject, data);
            }

            // Call Plunk's transactional email API directly
            const { data: response } = await axios.post(
                PLUNK_SEND_URL,
                {
                    to,
                    subject,
                    body: html,
                    type: "html",
                    from: this.from,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(`Email sent successfully to ${to}`);
            return response;
        } catch (error) {
            // Surface Plunk's response body when the request itself failed
            const status = error.response?.status;
            const detail = error.response?.data || error.message;
            console.error("Failed to send email:", detail);

            // A bad/missing key shouldn't crash the login flow. On an auth error
            // (401/403) or in development, fall back to logging the email so the
            // OTP is still readable from the console.
            if (status === 401 || status === 403 || process.env.NODE_ENV === "development") {
                console.warn(
                    "Plunk rejected the API key (or none worked) — falling back to console logging. " +
                    "Check PLUNK_API_KEY in .env and restart the server to send real emails."
                );
                return this.logDevEmail(to, subject, data);
            }
            throw error;
        }
    }

    /**
     * Logs the email (and any OTP) to the console instead of sending it.
     * Used as a dev-mode fallback when there's no API key or Plunk rejects it.
     */
    logDevEmail(to, subject, data) {
        console.log("------------------- EMAIL LOG (DEV MODE) -------------------");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        if (data && data.otp) {
            console.log(`OTP: ${data.otp}`);
        }
        console.log("------------------------------------------------------------");
        return { id: "dev-mode", status: "success" };
    }

    /**
     * Special method for sending OTPs
     */
    async sendOTP(email, otp) {
        return this.sendEmail(
            email,
            "Your Verification Code - Portfolio Admin",
            "otp",
            { otp }
        );
    }
}

module.exports = new EmailService();

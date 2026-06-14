const Plunk = require("@plunk/node").default;
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

class EmailService {
    constructor() {
        if (!process.env.PLUNK_API_KEY) {
            console.warn(
                "PLUNK_API_KEY environment variable not set. Email functionality will be limited."
            );
        }

        // Plunk export might be different depending on version/build, but usually it's the default export
        const PlunkClient = require("@plunk/node");
        this.plunk = process.env.PLUNK_API_KEY
            ? new (PlunkClient.default || PlunkClient)(process.env.PLUNK_API_KEY)
            : null;
    }

    async sendEmail(to, subject, template, data) {
        try {
            // Read and compile template
            const templatePath = path.join(process.cwd(), "src", "templates", `${template}.hbs`);

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

            // If in development mode without API key, log email instead of sending
            if (!this.plunk) {
                console.log("------------------- EMAIL LOG (DEV MODE) -------------------");
                console.log(`To: ${to}`);
                console.log(`Subject: ${subject}`);
                console.log("------------------------------------------------------------");
                return { id: "dev-mode", status: "success" };
            }

            // Construct email payload
            const response = await this.plunk.emails.send({
                to,
                subject: subject,
                body: html,
            });

            console.log(`Email sent successfully to ${to}`);
            return response;
        } catch (error) {
            console.error("Failed to send email:", error);
            if (process.env.NODE_ENV === "development") {
                return { id: "dev-mode", status: "success" };
            }
            throw error;
        }
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

    // Optional: Method to verify email
    async verifyEmail(email) {
        try {
            if (!this.plunk) {
                console.log(
                    `Email verification would happen in production for: ${email}`
                );
                return { status: "dev-mode", valid: true };
            }

            const response = await this.plunk.emails.verify(email);
            return response;
        } catch (error) {
            console.error("Email verification failed:", error);
            throw new Error(`Email verification failed: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
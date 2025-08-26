import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - CoinMRI",
  description: "Privacy Policy for CoinMRI cryptocurrency analytics platform",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gradient-to-r from-slate-800/70 to-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 shadow-xl">
          <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>

          <p className="text-gray-300 mb-6">
            <strong className="text-white">Effective Date:</strong> June 30, 2025
          </p>

          <p className="text-gray-300 mb-8">
            This Privacy Policy describes how your personal information is handled in the{" "}
            <strong className="text-white">CoinMRI</strong> mobile application ("App").
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300">
              We do not collect or store any personally identifiable information (PII) from users. The App may use
              public APIs to retrieve cryptocurrency data based on the symbols you input.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Data</h2>
            <p className="text-gray-300">
              The data fetched is only used to display market insights such as price, volatility, trend, top gainers,
              losers, and arbitrage opportunities. We do not track your queries or store any personal usage logs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Sharing</h2>
            <p className="text-gray-300">
              We do not share, sell, or rent user data to any third parties. All market data is retrieved from public or
              third-party sources (e.g., Binance API).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Security</h2>
            <p className="text-gray-300">
              We do not collect sensitive data, therefore minimal risk is associated with your usage. However, we take
              reasonable precautions to ensure our APIs and app remain secure and free from threats.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Children's Privacy</h2>
            <p className="text-gray-300">
              This App is not intended for children under the age of 13. We do not knowingly collect personal
              information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Changes to This Policy</h2>
            <p className="text-gray-300">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with a new
              effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions or concerns regarding this privacy policy, please contact us at:
            </p>
            <p className="text-gray-300">
              <strong className="text-white">Email:</strong>{" "}
              <a href="mailto:info@coinmri.com" className="text-blue-400 hover:text-blue-300 underline">
                info@coinmri.com
              </a>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-slate-700">
            <a href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

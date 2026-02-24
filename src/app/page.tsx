import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800/50 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-amber-500">Harambee Sacco</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/register"
                className="bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Financial Freedom Through Unity
          </h2>
          <p className="text-xl text-neutral-400 mb-10">
            Join thousands of members building wealth together. 
            Easy registration, instant access to loans, and secure savings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Join Now — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-neutral-800/30">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-12">
            Why Choose Harambee Sacco?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-neutral-800 p-6 rounded-xl">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Quick Loans</h4>
              <p className="text-neutral-400">
                Get approved for loans within hours. Low interest rates with flexible repayment options.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-neutral-800 p-6 rounded-xl">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Secure Savings</h4>
              <p className="text-neutral-400">
                Your money is safe with us. Enjoy competitive interest rates on your savings.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-neutral-800 p-6 rounded-xl">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Digital Banking</h4>
              <p className="text-neutral-400">
                Access your account 24/7 from anywhere. Check balances, transfer funds, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-neutral-400 mb-8">
            Join over 10,000 members growing their wealth with Harambee Sacco
          </p>
          <Link
            href="/register"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-800 py-8 px-4 border-t border-neutral-700">
        <div className="max-w-6xl mx-auto text-center text-neutral-500">
          <p>© 2024 Harambee Sacco. All rights reserved.</p>
          <p className="mt-2">Building wealth together, one member at a time.</p>
        </div>
      </footer>
    </main>
  );
}

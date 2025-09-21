import { Cpu, Scale, MessagesSquare, Clock3, Shield, Globe2 } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Cpu,
      title: "AI-Powered Analysis",
      description: "Advanced language models provide nuanced understanding of complex news stories with contextual analysis.",
    },
    {
      icon: Scale,
      title: "Bias Detection",
      description: "Multi-pass analysis identifies political lean and confidence levels with transparent rationale for every assessment.",
    },
    {
      icon: MessagesSquare,
      title: "Multiple Perspectives",
      description: "See how different stakeholders view the same story, helping you understand the full spectrum of opinions.",
    },
    {
      icon: Clock3,
      title: "Save Time",
      description: "Get comprehensive understanding in seconds instead of spending minutes reading multiple sources.",
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "All analyses auto-delete after 24 hours. No tracking, no permanent storage, no user accounts required.",
    },
    {
      icon: Globe2,
      title: "Works Everywhere",
      description: "Compatible with most major news sites and publications. Simply paste any article URL to get started.",
    }
  ];

  return (
    <section id="everything-you-need" className="py-20 px-4" style={{backgroundColor: 'var(--mist)'}}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="headline-font text-4xl md:text-5xl mb-6" style={{color: 'var(--ink)'}}>
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive news analysis tools designed for the modern information landscape
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-2xl card-shadow-hover transition-all duration-300"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{backgroundColor: index % 3 === 0 ? 'var(--sky)' : index % 3 === 1 ? 'var(--blush)' : 'var(--mist)'}}
              >
                <feature.icon 
                  className="h-6 w-6" 
                  style={{color: 'var(--sage)'}} 
                />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--ink)'}}>
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="#"
            className="btn-blush px-8 py-4 font-semibold inline-block transition-all hover:transform hover:translate-y-[-2px]"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('input[type="url"]')?.scrollIntoView({ behavior: 'smooth' });
              (document.querySelector('input[type="url"]') as HTMLInputElement)?.focus();
            }}
          >
            Try it free
          </a>
        </div>
      </div>
    </section>
  );
}
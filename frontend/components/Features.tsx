import { Brain, BarChart3, Users, Clock, Shield, Zap } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced language models provide nuanced understanding of complex news stories with contextual analysis."
    },
    {
      icon: BarChart3,
      title: "Bias Detection",
      description: "Multi-pass analysis identifies political lean and confidence levels with transparent rationale for every assessment."
    },
    {
      icon: Users,
      title: "Multiple Perspectives",
      description: "See how different stakeholders view the same story, helping you understand the full spectrum of opinions."
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Get comprehensive understanding in seconds instead of spending minutes reading multiple sources."
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "All analyses auto-delete after 24 hours. No tracking, no permanent storage, no user accounts required."
    },
    {
      icon: Zap,
      title: "Works Everywhere",
      description: "Compatible with most major news sites and publications. Simply paste any article URL to get started."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-['Inter',system-ui,sans-serif]">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-['Inter',system-ui,sans-serif]">
            Comprehensive news analysis tools designed for the modern information landscape
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-[#A3B18A] bg-opacity-10 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-[#A3B18A]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-['Inter',system-ui,sans-serif]">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed font-['Inter',system-ui,sans-serif]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
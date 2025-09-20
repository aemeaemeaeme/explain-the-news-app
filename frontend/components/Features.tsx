import { Shield, Clock, Lightbulb, BarChart3, Users, HelpCircle } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: "Bias Analysis",
    description: "Clear visual breakdown of political lean with confidence ratings"
  },
  {
    icon: Users,
    title: "Multiple Perspectives",
    description: "See different viewpoints and find common ground between them"
  },
  {
    icon: Lightbulb,
    title: "Simple Explanations",
    description: "Complex topics broken down in easy-to-understand language"
  },
  {
    icon: HelpCircle,
    title: "Follow-up Questions",
    description: "Naturally curious questions to deepen your understanding"
  },
  {
    icon: Clock,
    title: "Quick Summaries",
    description: "Get the key points without reading the entire article"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "All summaries automatically delete after 24 hours"
  }
];

export default function Features() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI analyzes news from every angle to give you complete understanding
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="p-3 bg-[#A3B18A]/10 rounded-xl w-fit mb-6">
                <feature.icon className="h-6 w-6 text-[#A3B18A]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

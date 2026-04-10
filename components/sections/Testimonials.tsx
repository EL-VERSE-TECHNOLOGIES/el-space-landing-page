import { TESTIMONIALS } from '@/lib/constants'
import { SectionHeader } from '@/components/ui/SectionHeader'

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          subheading="Real Results"
          heading="What Our Community Says"
          description="Stories from clients and freelancers who&apos;ve transformed their work."
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {TESTIMONIALS.map((testimonial, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-8"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i} className="text-xl">
                    ⭐
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="mb-6 text-lg font-medium text-foreground leading-relaxed italic">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <p className="font-semibold text-foreground">{testimonial.author}</p>
              <p className="text-sm text-muted-foreground">
                {testimonial.type === 'client' ? 'Client' : 'Freelancer'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

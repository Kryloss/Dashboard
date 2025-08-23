import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
    fullName: string
}

export const WelcomeEmail = ({ fullName }: WelcomeEmailProps) => (
    <Html>
        <Head />
        <Preview>Welcome to Kryloss - Your productivity platform is ready!</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={logoSection}>
                    <Heading style={logoText}>Kryloss</Heading>
                </Section>

                <Heading style={h1}>Welcome to Kryloss, {fullName}!</Heading>

                <Text style={text}>
                    Thank you for joining Kryloss, your centralized hub for powerful productivity tools.
                    Your account has been successfully created and you&apos;re ready to start exploring.
                </Text>

                <Section style={platformSection}>
                    <Heading style={h2}>Explore Your Tools</Heading>
                    <Text style={text}>
                        Access your productivity suite through these powerful platforms:
                    </Text>

                    <Section style={toolsList}>
                        <div style={toolItem}>
                            <strong style={toolName}>Healthify</strong>
                            <Text style={toolDescription}>
                                Advanced health analytics with AI-powered insights and comprehensive tracking.
                            </Text>
                            <Link href="https://healthify.kryloss.com" style={toolLink}>
                                Launch Healthify →
                            </Link>
                        </div>

                        <div style={toolItem}>
                            <strong style={toolName}>Notify</strong>
                            <Text style={toolDescription}>
                                Smart notification management with intelligent priority filtering.
                            </Text>
                            <Link href="https://notify.kryloss.com" style={toolLink}>
                                Launch Notify →
                            </Link>
                        </div>
                    </Section>
                </Section>

                <Section style={ctaSection}>
                    <Button style={button} href="https://kryloss.com/dashboard">
                        Access Your Dashboard
                    </Button>
                </Section>

                <Text style={text}>
                    Need help getting started? Visit our{" "}
                    <Link href="https://kryloss.com/docs" style={link}>
                        documentation
                    </Link>{' '}
                    or reach out to our support team.
                </Text>

                <Section style={footer}>
                    <Text style={footerText}>
                        Best regards,<br />
                        The Kryloss Team
                    </Text>

                    <Text style={footerText}>
                        <Link href="https://kryloss.com" style={link}>
                            kryloss.com
                        </Link>
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
)

// Styles based on design.json tokens
const main = {
    backgroundColor: '#0B0C0D',
    fontFamily: 'ui-sans-serif, system-ui, Inter, "Segoe UI", Roboto, sans-serif',
}

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '580px',
}

const logoSection = {
    textAlign: 'center' as const,
    marginBottom: '32px',
}

const logoText = {
    color: '#FBF7FA',
    fontSize: '32px',
    fontWeight: '800',
    lineHeight: '36px',
    margin: '0',
    background: 'linear-gradient(135deg, #114EB2 0%, #257ADA 60%, #4AA7FF 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
}

const h1 = {
    color: '#FBF7FA',
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '34px',
    margin: '0 0 24px',
    textAlign: 'center' as const,
}

const h2 = {
    color: '#FBF7FA',
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '26px',
    margin: '32px 0 16px',
}

const text = {
    color: '#9CA9B7',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px',
}

const platformSection = {
    backgroundColor: '#121922',
    border: '1px solid #2A3442',
    borderRadius: '20px',
    padding: '24px',
    margin: '32px 0',
}

const toolsList = {
    margin: '16px 0',
}

const toolItem = {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #1C2430',
}

const toolName = {
    color: '#FBF7FA',
    fontSize: '16px',
    fontWeight: '600',
    display: 'block',
    marginBottom: '8px',
}

const toolDescription = {
    color: '#9CA9B7',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 8px',
}

const toolLink = {
    color: '#4AA7FF',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: '500',
}

const ctaSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
}

const button = {
    backgroundColor: '#257ADA',
    borderRadius: '9999px',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
    boxShadow: '0 0 60px rgba(37, 122, 218, 0.35)',
}

const link = {
    color: '#4AA7FF',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
}

const footer = {
    textAlign: 'center' as const,
    margin: '32px 0 0',
    paddingTop: '32px',
    borderTop: '1px solid #1C2430',
}

const footerText = {
    color: '#556274',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 8px',
}

export default WelcomeEmail

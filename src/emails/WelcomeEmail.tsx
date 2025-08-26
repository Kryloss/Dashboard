import React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Heading,
    Text,
    Button,
    Hr,
} from '@react-email/components';

interface WelcomeEmailProps {
    username?: string;
}

export default function WelcomeEmail({ username }: WelcomeEmailProps) {
    const greeting = username ? `Hello ${username}!` : 'Hello there!';

    return (
        <Html>
            <Head />
            <Body style={{
                backgroundColor: '#0B0C0D',
                color: '#FBF7FA',
                fontFamily: 'ui-sans-serif, system-ui, Inter, Segoe UI, Roboto, sans-serif',
                margin: 0,
                padding: 0,
            }}>
                <Container style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '40px 20px',
                }}>
                    {/* Header */}
                    <Section style={{
                        textAlign: 'center',
                        marginBottom: '40px',
                    }}>
                        <Heading style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#FBF7FA',
                            margin: '0 0 16px 0',
                            letterSpacing: '-0.5px',
                        }}>
                            Welcome to Kryloss
                        </Heading>
                        <Text style={{
                            fontSize: '18px',
                            color: '#9CA9B7',
                            margin: 0,
                            lineHeight: '26px',
                        }}>
                            Your health journey starts here
                        </Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={{
                        backgroundColor: '#121922',
                        borderRadius: '20px',
                        border: '1px solid #2A3442',
                        padding: '32px',
                        marginBottom: '32px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.40)',
                    }}>
                        <Text style={{
                            fontSize: '18px',
                            color: '#FBF7FA',
                            margin: '0 0 24px 0',
                            lineHeight: '26px',
                        }}>
                            {greeting}
                        </Text>

                        <Text style={{
                            fontSize: '16px',
                            color: '#9CA9B7',
                            margin: '0 0 24px 0',
                            lineHeight: '26px',
                        }}>
                            We&apos;re excited to have you on board! Your account has been successfully created and you&apos;re now ready to start tracking your health metrics, setting goals, and monitoring your progress.
                        </Text>

                        <Text style={{
                            fontSize: '16px',
                            color: '#9CA9B7',
                            margin: '0 0 32px 0',
                            lineHeight: '26px',
                        }}>
                            Get started by exploring your personalized dashboard and setting up your first health goals.
                        </Text>

                        {/* CTA Button */}
                        <Section style={{
                            textAlign: 'center',
                            marginBottom: '24px',
                        }}>
                            <Button
                                href="https://kryloss.com/dashboard"
                                style={{
                                    backgroundColor: '#257ADA',
                                    background: 'linear-gradient(135deg, #114EB2 0%, #257ADA 60%, #4AA7FF 100%)',
                                    color: '#FFFFFF',
                                    padding: '16px 32px',
                                    borderRadius: '9999px',
                                    textDecoration: 'none',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    boxShadow: '0 0 60px rgba(37,122,218,0.35)',
                                }}
                            >
                                Go to Dashboard
                            </Button>
                        </Section>
                    </Section>

                    {/* Features Preview */}
                    <Section style={{
                        backgroundColor: '#0F101A',
                        borderRadius: '16px',
                        border: '1px solid #1C2430',
                        padding: '24px',
                        marginBottom: '32px',
                    }}>
                        <Heading style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#FBF7FA',
                            margin: '0 0 20px 0',
                        }}>
                            What you can do:
                        </Heading>

                        <Text style={{
                            fontSize: '14px',
                            color: '#9CA9B7',
                            margin: '0 0 12px 0',
                            lineHeight: '20px',
                        }}>
                            • Track daily health metrics and goals
                        </Text>
                        <Text style={{
                            fontSize: '14px',
                            color: '#9CA9B7',
                            margin: '0 0 12px 0',
                            lineHeight: '20px',
                        }}>
                            • Monitor progress with beautiful charts
                        </Text>
                        <Text style={{
                            fontSize: '14px',
                            color: '#9CA9B7',
                            margin: '0 0 12px 0',
                            lineHeight: '20px',
                        }}>
                            • Set personalized health targets
                        </Text>
                        <Text style={{
                            fontSize: '14px',
                            color: '#9CA9B7',
                            margin: 0,
                            lineHeight: '20px',
                        }}>
                            • Get insights and recommendations
                        </Text>
                    </Section>

                    <Hr style={{
                        borderColor: '#2A3442',
                        margin: '32px 0',
                    }} />

                    {/* Footer */}
                    <Section style={{
                        textAlign: 'center',
                    }}>
                        <Text style={{
                            fontSize: '14px',
                            color: '#556274',
                            margin: '0 0 16px 0',
                        }}>
                            If you have any questions, feel free to reach out to our support team.
                        </Text>

                        <Text style={{
                            fontSize: '12px',
                            color: '#556274',
                            margin: 0,
                        }}>
                            © 2024 Kryloss. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

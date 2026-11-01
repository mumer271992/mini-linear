import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "react-email";

interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
}

// Plain, portable component like InviteEmail -- rendered server-side by
// resend.emails.send({ react: ... }), but also previewable in react-email.
export function VerifyEmail({ name, verifyUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to start using Mini Linear</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "sans-serif", margin: 0 }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            padding: "32px",
            borderRadius: "8px",
            margin: "40px auto",
            maxWidth: "480px",
          }}
        >
          <Heading style={{ fontSize: "20px", marginBottom: "8px" }}>Verify your email</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "22px" }}>
            Hi {name}, confirm this is your email address to finish setting up your Mini Linear
            account.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={verifyUrl}
              style={{
                backgroundColor: "#09090b",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Verify email
            </Button>
          </Section>
          <Hr style={{ borderColor: "#e4e4e7" }} />
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            This link expires in 24 hours. If you didn&apos;t create a Mini Linear account, you can
            safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

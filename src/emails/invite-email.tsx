import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "react-email";

interface InviteEmailProps {
  organizationName: string;
  inviterName: string;
  acceptUrl: string;
}

// A plain, portable component -- no "use client"/server-only, since this
// gets rendered server-side by resend.emails.send({ react: ... }) but could
// equally be opened in react-email's own local preview tool.
export function InviteEmail({ organizationName, inviterName, acceptUrl }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {organizationName} on Mini Linear
      </Preview>
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
          <Heading style={{ fontSize: "20px", marginBottom: "8px" }}>You&apos;ve been invited</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "22px" }}>
            <strong>{inviterName}</strong> invited you to join <strong>{organizationName}</strong> on
            Mini Linear.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={acceptUrl}
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
              Accept invite
            </Button>
          </Section>
          <Hr style={{ borderColor: "#e4e4e7" }} />
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            This invite expires in 7 days. If you weren&apos;t expecting this, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AlertNotificationRequest {
  alertId: string;
  latitude: number;
  longitude: number;
  mapsLink: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { alertId, latitude, longitude, mapsLink }: AlertNotificationRequest =
      await req.json();

    const { data: contacts, error: contactsError } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No active emergency contacts found",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = {
      emailsSent: 0,
      telegramsSent: 0,
      errors: [] as string[],
    };

    const alertTime = new Date().toLocaleString();
    const emailSubject = "🚨 EMERGENCY ALERT - Immediate Attention Required";
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
            <strong>${user.email}</strong> has triggered an emergency alert and needs immediate assistance.
          </p>

          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">Time: ${alertTime}</p>
          </div>

          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Location Details:</h2>
            <p style="margin: 5px 0; color: #4b5563;">Latitude: ${latitude}</p>
            <p style="margin: 5px 0; color: #4b5563;">Longitude: ${longitude}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${mapsLink}"
               style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              📍 View Location on Google Maps
            </a>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Action Required:</strong> Please contact ${user.email} immediately or reach out to local emergency services if you cannot establish contact.
            </p>
          </div>
        </div>
        <div style="background-color: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">This is an automated alert from the Emergency Alert System</p>
        </div>
      </div>
    `;

    const telegramMessage = `
🚨 *EMERGENCY ALERT*

${user.email} has triggered an emergency alert and needs immediate assistance.

⏰ *Time:* ${alertTime}
📍 *Location:* ${latitude}, ${longitude}

🗺️ [View on Google Maps](${mapsLink})

⚠️ Please contact ${user.email} immediately or reach out to local emergency services.
    `;

    if (resendApiKey) {
      for (const contact of contacts) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Emergency Alert <alerts@resend.dev>",
              to: [contact.email],
              subject: emailSubject,
              html: emailBody,
            }),
          });

          if (emailResponse.ok) {
            results.emailsSent++;
          } else {
            const errorData = await emailResponse.text();
            results.errors.push(
              `Email to ${contact.email} failed: ${errorData}`
            );
          }
        } catch (error) {
          results.errors.push(
            `Email to ${contact.email} failed: ${(error as Error).message}`
          );
        }
      }
    }

    if (telegramBotToken) {
      for (const contact of contacts) {
        if (contact.telegram_chat_id) {
          try {
            const telegramResponse = await fetch(
              `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  chat_id: contact.telegram_chat_id,
                  text: telegramMessage,
                  parse_mode: "Markdown",
                }),
              }
            );

            if (telegramResponse.ok) {
              results.telegramsSent++;
            } else {
              const errorData = await telegramResponse.text();
              results.errors.push(
                `Telegram to ${contact.name} failed: ${errorData}`
              );
            }
          } catch (error) {
            results.errors.push(
              `Telegram to ${contact.name} failed: ${(error as Error).message}`
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent",
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

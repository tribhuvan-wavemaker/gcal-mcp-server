import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { google } from "googleapis";
import { z } from "zod";

// dotenv.config();

// create the MCP server
const server = new McpServer({
    name: "Tribhu's Calendar",
    version: "1.0.0"
});

// tool function
async function getMyCalendarDataByDate(date) {
    const calendar = google.calendar({
        version: "v3",
        auth: process.env.GOOGLE_PUBLIC_API_KEY,
        // auth : "AIzaSyAPMlPhVZDskm1MVekPoO0KorGrXv2nMTc"
    });

    // Calculate the start and end of the given date (UTC)
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    try {
        const res = await calendar.events.list({
            calendarId: process.env.CALENDAR_ID,
            // calendarId: "tribhuvan.durgam@wavemaker.com",
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = res.data.items || [];
        const meetings = events.map((event) => {
            const start = event.start.dateTime || event.start.date;
            return `${event.summary} at ${start}`;
        });

        if (meetings.length > 0) {
            return {
                meetings,
            };
        } else {
            return {
                meetings: [],
            };
        }
    } catch (err) {
        return {
            error: err.message,
        };
    }
}

// register the tool to MCP
server.tool(
    "getMyCalendarDataByDate","Get calendar data of Tribhu for a specific date",
    {
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format. Please provide a valid date string.",
        }),
    },
    async ({ date }) => {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(await getMyCalendarDataByDate(date)),
                },
            ],
        };
    }
);

// set transport
async function init() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

// call the initialization
init();
# incident.io MCP Server

An MCP (Model Context Protocol) server for interacting with the incident.io API. This server provides tools to manage incidents through natural language interactions.

## Features

- List and filter incidents
- Create new incidents
- Update incident details and status
- Assign users to incident roles (e.g., Incident Lead)
- View incident update history
- List and view follow-ups
- List severities, incident types, roles, and users

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/twentworth12/incidentio-mcp.git
   cd incidentio-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your incident.io API key to the `.env` file:
   ```
   INCIDENTIO_API_KEY=your_api_key_here
   ```

   You can create an API key in your incident.io dashboard under Settings → API keys.

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration:

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "incidentio": {
      "command": "node",
      "args": ["/path/to/incidentio-mcp/dist/index.js"],
      "env": {
        "INCIDENTIO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "incidentio": {
      "command": "node",
      "args": ["C:\\path\\to\\incidentio-mcp\\dist\\index.js"],
      "env": {
        "INCIDENTIO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Replace `/path/to/incidentio-mcp` with the actual path where you cloned this repository.

## Available Tools

### Incident Management

#### list_incidents
List incidents with optional filters:
- `page_size`: Number of incidents per page (default: 25)
- `status`: Array of statuses to filter by (triage, investigating, monitoring, closed, declined)
- `severity`: Array of severity IDs to filter by

#### create_incident
Create a new incident:
- `name` (required): Name of the incident
- `severity_id` (required): ID of the severity level (use `list_severities` to see options)
- `incident_type_id` (required): ID of the incident type (use `list_incident_types` to see options)
- `summary`: Incident summary
- `custom_field_entries`: Array of custom field values

#### get_incident
Get details of a specific incident:
- `incident_id` (required): ID of the incident

#### update_incident
Update an existing incident:
- `incident_id` (required): ID of the incident to update
- `name`: Updated name
- `summary`: Updated summary
- `status`: Updated status (triage, investigating, monitoring, closed, declined)
- `severity_id`: Updated severity ID

### Role Assignment

#### update_incident_role
Assign or update a role for an incident:
- `incident_id` (required): ID of the incident
- `role_id` (required): ID of the role (e.g., for Incident Lead)
- `user_id` (required): ID of the user to assign
- `notify_incident_channel`: Whether to notify the incident Slack channel (default: true)

#### list_incident_roles
List available incident roles in your organization.

### Incident Updates

#### list_incident_updates
View the update history for an incident:
- `incident_id` (required): ID of the incident
- `page_size`: Number of updates to return per page (default: 25)

### Follow-ups

#### list_follow_ups
List follow-ups across all incidents or for a specific incident:
- `incident_id`: Filter by incident ID (optional)
- `page_size`: Number of follow-ups to return per page (default: 25)

#### get_follow_up
Get details of a specific follow-up:
- `follow_up_id` (required): ID of the follow-up

### Reference Data

#### list_severities
List available severity levels in your organization.

#### list_incident_types
List available incident types in your organization.

#### list_users
List users in your organization:
- `page_size`: Number of users per page (default: 25)

## Example Usage

Once configured in Claude Desktop, you can use natural language to interact with incident.io:

- "List all open incidents"
- "Create a new incident called 'Database connection timeout' with high severity"
- "Assign John Doe as the incident lead for incident INC-123"
- "Show me the update history for incident INC-123"
- "Update incident INC-123 status to investigating"

## Development

Run the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Clean build artifacts:
```bash
npm run clean
```

## Troubleshooting

### Rate Limiting
If you see a 429 error, you've hit the incident.io API rate limit. The server will log rate limit headers to help you understand when you can retry.

### 404 Errors
If you get 404 errors when using certain tools:
- Verify the incident ID exists
- Check that your API key has the necessary permissions
- Ensure you're using valid IDs for roles, users, and other entities

## License

MIT
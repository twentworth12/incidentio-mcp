# incident.io MCP Server

An MCP (Model Context Protocol) server for interacting with the incident.io API. This server provides tools to manage incidents through natural language interactions.

## Features

- List incidents with filtering options
- Create new incidents
- Get incident details
- Update incident status and properties

## Installation

1. Clone this repository
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

Add this server to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

## Available Tools

### list_severities
List available severity levels in your incident.io organization. Use this to get valid `severity_id` values for creating incidents.

### list_incident_types
List available incident types in your incident.io organization. Use this to get valid `incident_type_id` values for creating incidents.

### list_incidents
List incidents with optional filters:
- `page_size`: Number of incidents per page (default: 25)
- `status`: Array of statuses to filter by (triage, investigating, monitoring, closed, declined)
- `severity`: Array of severity IDs to filter by

### create_incident
Create a new incident:
- `name` (required): Name of the incident
- `severity_id` (required): ID of the severity level (use `list_severities` to see options)
- `incident_type_id` (required): ID of the incident type (use `list_incident_types` to see options)
- `summary`: Incident summary
- `custom_field_entries`: Array of custom field values

### get_incident
Get details of a specific incident:
- `incident_id` (required): ID of the incident

### update_incident
Update an existing incident:
- `incident_id` (required): ID of the incident to update
- `name`: Updated name
- `summary`: Updated summary
- `status`: Updated status
- `severity_id`: Updated severity ID

## Development

Run the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## License

MIT
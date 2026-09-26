# StockSense Client Design

**Source**: Extracted from the authenticated dashboard and current client styles.

## Character

A focused inventory work surface. The dashboard uses a dark canvas, clear light text, quiet outlines, and restrained indigo and status accents. Pages prioritize operational information and quick scanning over decoration.

## Build mandate

Follow the dashboard for authenticated work pages. Keep content left aligned and use the available width for operational data. Use a compact page heading, clear section labels, and a visible path between the dashboard and the current page. Use cards only when they group a distinct unit of information. Do not add decorative hero sections or background imagery.

For location management, place the searchable location table first. Keep warehouse and status filters near the search. Use a side panel for create and edit, and a selected location detail panel for its stock summary. Show status with text as well as color. On narrow screens, let the table scroll within its region and let the side panel use the full screen.

## Component and usage rules

- Use semantic headings, navigation, tables, forms, and buttons.
- Keep labels visible beside form controls. Show validation beside the field that needs attention.
- Make loading, empty, no result, and error states distinct. Errors should say what failed and what the user can do next.
- Keep warehouse staff views read only. Do not rely on hidden buttons as the only permission check.
- Use restrained motion only when a panel opens or closes. Respect reduced motion settings.
- Use no imagery for location administration. Do not use emoji as controls or status marks.
- Maintain visible keyboard focus and sufficient contrast for text, controls, and status indicators.

## Tokens

Token values live in `src/index.css` under the `--ss-*` custom properties. Use those values in new client styles. Do not copy color or spacing values into this file.

## Responsive behavior

The dashboard reduces outer spacing and rearranges its grids at narrow widths. Preserve that approach. Keep filters usable on a phone, keep table overflow inside the table region, and make the location form panel fill the screen when space is limited.

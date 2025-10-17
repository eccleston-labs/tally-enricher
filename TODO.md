- Implement the test form in the 'instructions' tab in /dashboard; currently it's a no-op [ ]
- Pull in the actual workspace name in the integration snippet in the same tab; don't worry about the URL for now [ ]

GABE TO DO:
- Analytics and Workspaces currently soft linked by workspace_name string, can move to ids for relational integrity. (maybe)
- Figure out our website domain
- slack messaging endpoint and logs
- basic research and endpoint
- sign up from call in landing page
- add revenue

- research into the person
- more slack messages based off linkedin research

- grab first and lastr name from form as optional
- use in pdl enrichment (another request) parallel with company enrich

- hit linkedin api

http://localhost:3000/r?email=jensen@nvidia.com&workspace_name=GabeTests&first_name=Jensen&last_name=Huang

http://localhost:3000/r?email=marisa@attio.com&workspace_name=GabeTests&first_name=Marisa&last_name=McGill
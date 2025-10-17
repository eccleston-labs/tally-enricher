GABE TO DO:
- Analytics and Workspaces currently soft linked by workspace_name string, can move to ids for relational integrity. (maybe)
- Figure out our website domain
- sign up from call in landing page
- add revenue

- hit linkedin api

http://localhost:3000/r?email=jensen@nvidia.com&workspace_name=GabeTests&first_name=Jensen&last_name=Huang

http://localhost:3000/r?email=marisa@whatsapp.com&workspace_name=GabeTests

curl -X POST "https://api.peopledatalabs.com/v5/person/enrich" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: e117e7455b78d1fb0e7ce195c74530c25ae5e0241464650ba1fba68bf5fb1c09" \
  -d '{
    "first_name": "Fred",
    "last_name": "Amstutz",
    "company": "attio.com"
  }'
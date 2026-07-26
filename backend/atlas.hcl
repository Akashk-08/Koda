data "external_schema" "prisma" {
  program = [
    "npx",
    "prisma",
    "atlas",
    "schema"
  ]
}

env "local" {
  src = data.external_schema.prisma.url
  dev = "docker://postgres/15/dev" // Or your database type (e.g., mysql/8/dev)
}
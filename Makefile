.PHONY: bootstrap install dev test test-watch typecheck build preview ui-add

bootstrap: install

install:
	npm install

dev:
	npm run dev

test:
	npm test

test-watch:
	npm run test:watch

typecheck:
	npm run typecheck

build:
	npm run build

preview:
	npm run preview

# usage: make ui-add C="button dialog"
ui-add:
	npx shadcn@latest add $(C)

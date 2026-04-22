dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

down:
	docker compose down

reset:
	docker compose down -v

migrate:
	docker compose exec backend python manage.py migrate

superuser:
	docker compose exec backend python manage.py createsuperuser

shell:
	docker compose exec backend python manage.py shell

psql:
	docker compose exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

logs:
	docker compose logs -f

logs-back:
	docker compose logs -f backend

logs-front:
	docker compose logs -f frontend

ps:
	docker compose ps
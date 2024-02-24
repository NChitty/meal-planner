FROM ghcr.io/cargo-lambda/cargo-lambda:1.1.0 as cargo-lambda-user

RUN groupadd -r -g 1000 appuser
RUN useradd -r -u 1000 -g appuser appuser
USER appuser

FROM cargo-lambda-user as meal-planner-api-development

WORKDIR /usr/src/app
COPY . .
EXPOSE 8080

CMD [ "cargo", "lambda", "watch", "-a", "0.0.0.0", "-p", "8080"]

FROM meal-planner-api-development as meal-planner-api-build

RUN cargo lambda build -r -l /tmp

FROM public.ecr.aws/lambda/provided:al2 as meal-planner-api

COPY --from=meal-planner-api-build /tmp/lambda/bootstrap ${LAMBDA_RUNTIME_DIR}

CMD [ "bootstrap" ]

FROM ghcr.io/cargo-lambda/cargo-lambda:1.1.0 as cargo-lambda-user

RUN groupadd -r -g 1000 appuser
RUN useradd -r -u 1000 -g appuser appuser
USER 1000:1000

FROM cargo-lambda-user as meal-planner-api-development

WORKDIR /usr/src/app
COPY . .
EXPOSE 8080

CMD [ "cargo", "lambda", "watch", "-a", "0.0.0.0", "-p", "8080"]

FROM meal-planner-api-development as meal-planner-api-build

USER 0
RUN --mount=type=cache,target=/usr/local/cargo/registry \
  --mount=type=cache,target=./target \
  cargo lambda build -r -l /tmp

FROM public.ecr.aws/lambda/provided:al2023 as meal-planner-api

WORKDIR /opt

COPY --from=meal-planner-api-build /tmp/lambda/bootstrap ${LAMBDA_RUNTIME_DIR}

CMD [ "bootstrap" ]

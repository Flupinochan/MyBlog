# Build Stage
FROM python:3.12-slim As build

WORKDIR /app

COPY index.py LoggingClass.py requirements.txt ./

RUN pip install -r requirements.txt


# Runtime Stage
FROM public.ecr.aws/lambda/python:3.12 As Runtime

WORKDIR /app

COPY --from=build /app/index.py /app
COPY --from=build /app/LoggingClass.py /app
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

CMD ["index.lambda_handler"]
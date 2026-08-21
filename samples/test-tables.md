## Testing Tables

### Tables

#### Simple table

| Name    | Age | City    |
|---------|-----|---------|
| _Alice_ | 30  | NYC     |
| __Bob__ | 25  | LAX     |
| `Carol` | 35  | Chicago |

#### Table with alignment

| Left | Center | Right |
|:-----|:------:|------:|
| L1   |   C1   |    R1 |
| L2   |   C2   |    R2 |

Table with inline formatting:

| Scenario             | Description                                       |
|----------------------|---------------------------------------------------|
| `NORMAL_TRAFFIC`     | 60% deposits, 40% withdrawals, amounts $10-$1000  |
| `HIGH_VOLUME`        | Fast generation, varied amounts                   |
| `INSUFFICIENT_FUNDS` | 20% deposits, 80% withdrawals (triggers failures) |
| `FRAUD_DETECTION`    | High-velocity patterns, large withdrawals         |

Single-row table:

| Header 1 | Header 2  |
|----------|-----------|
| Only row | Data here |

### Misha tables

#### MetricCatalog _(existing, no changes)_

| Field          | Type        | Constraints      | Description                                       |
|----------------|-------------|------------------|---------------------------------------------------|
| id             | INTEGER     | PK, AUTO         | Primary key                                       |
| metric_id      | VARCHAR     | UNIQUE, NOT NULL | Unique metric identifier (e.g., `revenue::total`) |
| name           | VARCHAR     | NOT NULL         | Human-readable metric name                        |
| description    | TEXT        | NULLABLE         | Metric description                                |
| category       | VARCHAR     | NULLABLE         | Grouping category (Revenue, Customers, etc.)      |
| unit           | VARCHAR     | NULLABLE         | Display unit (`$`, %, days, etc.)                 |
| is_base_metric | BOOLEAN     | DEFAULT true     | Whether it's a base metric                        |
| data_type      | VARCHAR     | NOT NULL         | Data type (`currency`, number, `percent`)         |
| aggregate_type | VARCHAR     | NOT NULL         | Aggregation method (`last`, average, `total`)     |
| created_at     | TIMESTAMP   | DEFAULT NOW      | Creation timestamp                                |
| updated_at     | `TIMESTAMP` | DEFAULT NOW      | Last update timestamp                             |

И вот второй пример с емоджи

## Section 4 — Automation & Extensibility

Workflow engine, retention automation, webhook system, and operator skills platform.

| #   | Spec                        | Status        | Tasks | Change Dir                      |
|-----|-----------------------------|---------------|-------|---------------------------------|
| 21  | Webhook Automation          | ⬜ Not started | 0/45  | add-webhook-automation          |
| 22  | Workflow Automation Engine  | ⬜ Not started | 0/59  | add-workflow-automation-engine  |
| 23  | Retention Automation Engine | ⬜ Not started | 0/34  | add-retention-automation-engine |
| 24  | Operator Skills Platform    | ⬜ Not started | 0/56  | add-operator-skills-platform    |

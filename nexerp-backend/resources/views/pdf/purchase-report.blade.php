<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #222;
        }

        h1, h2, h3 {
            margin: 0;
        }

        .header {
            margin-bottom: 18px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }

        .brand {
            font-size: 20px;
            font-weight: bold;
        }

        .meta {
            margin-top: 6px;
            color: #555;
        }

        .section {
            margin-top: 16px;
        }

        .summary-table,
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }

        .summary-table td {
            border: 1px solid #ddd;
            padding: 7px;
        }

        .summary-label {
            font-weight: bold;
            background: #f5f5f5;
        }

        .data-table th,
        .data-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }

        .data-table th {
            background: #f5f5f5;
            font-weight: bold;
        }

        .text-right {
            text-align: right;
        }

        .empty {
            padding: 12px;
            border: 1px solid #ddd;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">NexERP</div>
        <h2>{{ $title }}</h2>
        <div class="meta">Generated: {{ $generatedAt }}</div>
    </div>

    <div class="section">
        <h3>Filters</h3>
        <table class="summary-table">
            <tr>
                <td class="summary-label">Date From</td>
                <td>{{ $filters['date_from'] ?? 'All' }}</td>
                <td class="summary-label">Date To</td>
                <td>{{ $filters['date_to'] ?? 'All' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>Summary</h3>
        <table class="summary-table">
            <tr>
                <td class="summary-label">Total Purchases</td>
                <td>{{ $summary['total_purchases'] }}</td>
                <td class="summary-label">Total Purchase Amount</td>
                <td>{{ $summary['total_purchase_amount'] }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>Purchase Items</h3>

        @if (count($items) > 0)
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Purchase ID</th>
                        <th>Supplier</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th class="text-right">Total Amount</th>
                        <th class="text-right">Items Count</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($items as $item)
                        <tr>
                            <td>{{ $item['id'] }}</td>
                            <td>{{ $item['supplier'] ?? '-' }}</td>
                            <td>{{ $item['purchase_date'] ?? '-' }}</td>
                            <td>{{ $item['status'] }}</td>
                            <td class="text-right">{{ $item['total_amount'] }}</td>
                            <td class="text-right">{{ $item['items_count'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="empty">No confirmed purchases found for the selected filters.</div>
        @endif
    </div>
</body>
</html>
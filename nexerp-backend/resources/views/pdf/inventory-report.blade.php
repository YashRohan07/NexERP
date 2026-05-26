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
                <td class="summary-label">Total Products</td>
                <td>{{ $summary['total_products'] }}</td>
                <td class="summary-label">Total Quantity</td>
                <td>{{ $summary['total_quantity'] }}</td>
            </tr>
            <tr>
                <td class="summary-label">Total Inventory Value</td>
                <td>{{ $summary['total_inventory_value'] }}</td>
                <td class="summary-label">Low Stock Count</td>
                <td>{{ $summary['low_stock_count'] }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>Inventory Items</h3>

        @if (count($items) > 0)
            <table class="data-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Unit Cost</th>
                        <th class="text-right">Total Value</th>
                        <th class="text-right">Threshold</th>
                        <th>Status</th>
                        <th>Purchase Date</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($items as $item)
                        <tr>
                            <td>{{ $item['sku'] ?? '-' }}</td>
                            <td>{{ $item['product'] ?? '-' }}</td>
                            <td class="text-right">{{ $item['quantity'] }}</td>
                            <td class="text-right">{{ $item['unit_cost'] }}</td>
                            <td class="text-right">{{ $item['total_value'] }}</td>
                            <td class="text-right">{{ $item['threshold'] }}</td>
                            <td>{{ $item['status'] }}</td>
                            <td>{{ $item['purchase_date'] ?? '-' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="empty">No inventory records found for the selected filters.</div>
        @endif
    </div>
</body>
</html>
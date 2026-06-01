<?php

namespace App\Modules\Report\Exports;

use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\Response;

class PdfExportService
{
    public function download(string $view, array $data, string $fileName): Response
    {
        return Pdf::loadView($view, $data)
            ->setPaper('a4', 'landscape')
            ->download($fileName);
    }
}
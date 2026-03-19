<?php

namespace AppHttpControllers;

use AppModelsEmailTemplate;
use IlluminateHttpRequest;

class EmailTemplateController extends Controller
{
    public function index() { return EmailTemplate::all(); }

    public function store(Request $request) {
        $val = $request->validate(['name' => 'required|string|max:255', 'subject' => 'required|string|max:255', 'body' => 'required|string']);
        return EmailTemplate::create($val);
    }

    public function update(Request $request, $id) {
        $val = $request->validate(['name' => 'required|string|max:255', 'subject' => 'required|string|max:255', 'body' => 'required|string']);
        $tpl = EmailTemplate::findOrFail($id);
        $tpl->update($val);
        return $tpl;
    }

    public function destroy($id) {
        EmailTemplate::destroy($id);
        return response()->json(['success' => true]);
    }
}

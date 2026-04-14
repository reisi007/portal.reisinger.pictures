<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    'stripe' => [
        'key' => env('STRIPE_KEY', env('APP_ENV') === 'production' ? null : 'pk_test_51TJyXn1YgMBoWMtKQ1JiPtIkXO5e0mkRki6WLJX4Mt6fzEOci0rVQzRqRCGOgIZ00v6mDZCXnAx8Q9axFX34Ih2d004vStDJql'),
        'secret' => env('STRIPE_SECRET', env('APP_ENV') === 'production' ? null : 'sk_test_51TJyXn1YgMBoWMtKsotyKDGOUxNI8NgiKIc9RlFoOrYMtrBaVBsAyA4Es2ZOVBb6oOyuRMxWv7inmr0H8ymPwFLH00LTusAHBr'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];

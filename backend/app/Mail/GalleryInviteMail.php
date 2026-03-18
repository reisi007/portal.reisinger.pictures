<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GalleryInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public $galleryName;
    public $inviteLink;

    public function __construct($galleryName, $inviteLink)
    {
        $this->galleryName = $galleryName;
        $this->inviteLink = $inviteLink;
    }

    public function build()
    {
        return $this->subject('Deine Foto-Auswahl: ' . $this->galleryName)
                    ->view('emails.invite');
    }
}

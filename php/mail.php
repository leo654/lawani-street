<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond($status, $payload) {
	http_response_code($status);
	echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
	exit;
}

function clean_header_value($value) {
	return trim(preg_replace("/[\r\n]+/", ' ', (string)$value));
}

function get_post_value($key) {
	return trim((string)($_POST[$key] ?? ''));
}

function text_length($value) {
	return function_exists('mb_strlen')
		? mb_strlen((string)$value, 'UTF-8')
		: strlen((string)$value);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond(405, array(
		'ok' => false,
		'error' => 'Method not allowed. Use POST.'
	));
}

$honeypot = get_post_value('website');
if ($honeypot !== '') {
	respond(200, array('ok' => true));
}

$name = clean_header_value(get_post_value('name'));
$email = clean_header_value(get_post_value('email'));
$message = get_post_value('message');

if (text_length($name) < 2 || text_length($name) > 120) {
	respond(422, array(
		'ok' => false,
		'error' => 'Please enter your name.'
	));
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
	respond(422, array(
		'ok' => false,
		'error' => 'Please enter a valid email address.'
	));
}

if (text_length($message) < 10 || text_length($message) > 5000) {
	respond(422, array(
		'ok' => false,
		'error' => 'Please enter a message with a bit more detail.'
	));
}

$recipient = 'talktolawanistreet@gmail.com';

$fromAddress = clean_header_value((string)getenv('CONTACT_FROM'));
if ($fromAddress === '' || !filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
	$fromAddress = $recipient;
}

$fromName = clean_header_value((string)getenv('CONTACT_FROM_NAME'));
if ($fromName === '') {
	$fromName = 'Website Contact';
}

$projectTypes = clean_header_value(get_post_value('projectTypes'));
$subject = $projectTypes !== ''
	? 'New project request: ' . substr($projectTypes, 0, 120)
	: 'Message from website contact form';
$safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));

$textBody = "Client name - {$name}\nEmail - {$email}\nMessage - {$message}";
$htmlBody = 'Client name - ' . $safeName . '<br>Email - ' . $safeEmail . '<br>Message - ' . $safeMessage;

$phpMailerDir = __DIR__ . '/../assets/js/mailer';
$mailerFiles = array(
	$phpMailerDir . '/Exception.php',
	$phpMailerDir . '/PHPMailer.php',
	$phpMailerDir . '/SMTP.php'
);
$hasPhpMailer = true;
foreach ($mailerFiles as $file) {
	if (!is_file($file)) {
		$hasPhpMailer = false;
		break;
	}
}

if ($hasPhpMailer) {
	require_once $phpMailerDir . '/Exception.php';
	require_once $phpMailerDir . '/PHPMailer.php';
	require_once $phpMailerDir . '/SMTP.php';

	$smtpHost = trim((string)getenv('SMTP_HOST'));
	$smtpUser = trim((string)getenv('SMTP_USERNAME'));
	$smtpPass = (string)getenv('SMTP_PASSWORD');
	$smtpPort = (int)getenv('SMTP_PORT');
	$smtpEncryption = trim((string)getenv('SMTP_ENCRYPTION'));

	if ($smtpHost !== '' && $smtpUser !== '' && $smtpPass !== '') {
		try {
			$mail = new \PHPMailer\PHPMailer\PHPMailer(true);
			$mail->isSMTP();
			$mail->CharSet = 'UTF-8';
			$mail->SMTPAuth = true;
			$mail->Host = $smtpHost;
			$mail->Username = $smtpUser;
			$mail->Password = $smtpPass;
			$mail->Port = $smtpPort > 0 ? $smtpPort : 587;

			if ($smtpEncryption !== '') {
				$mail->SMTPSecure = $smtpEncryption;
			}

			$mail->setFrom($fromAddress, $fromName);
			$mail->addAddress($recipient);
			$mail->addReplyTo($email, $name);
			$mail->isHTML(true);
			$mail->Subject = $subject;
			$mail->Body = $htmlBody;
			$mail->AltBody = $textBody;
			$mail->send();

			respond(200, array('ok' => true));
		} catch (\PHPMailer\PHPMailer\Exception $e) {
			error_log('Contact form SMTP send failed: ' . $e->getMessage());
			respond(500, array(
				'ok' => false,
				'error' => 'Email send failed via SMTP.'
			));
		}
	}
}

$headers = array(
	'MIME-Version: 1.0',
	'Content-Type: text/plain; charset=UTF-8',
	'From: ' . $fromAddress,
	'Reply-To: ' . $email
);

$sent = @mail($recipient, $subject, $textBody, implode("\r\n", $headers));
if (!$sent) {
	respond(500, array(
		'ok' => false,
		'error' => 'Email send failed. Configure SMTP_* for PHPMailer or local mail().'
	));
}

respond(200, array('ok' => true));

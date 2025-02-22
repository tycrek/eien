import { ensureDir } from '@std/fs';
import { Database } from '@db/sqlite';
import { log } from '../utils.ts';
import type { Upload } from '../types/Upload.ts';
import type { User } from '../types/User.ts';

// Prepare database on filesystem
await ensureDir('data/uploads');
const database = new Database('data/yaass.db');

export const DB = {
	init: () => {
		const [version] = database.prepare('select sqlite_version();').value<[string]>()!;

		// Create users table
		database.prepare(
			`CREATE TABLE IF NOT EXISTS users (
			_id INTEGER PRIMARY KEY AUTOINCREMENT,
			uid TEXT NOT NULL,
			name TEXT NOT NULL,
			username TEXT NOT NULL,
			passhash TEXT NOT NULL,
			owner BOOLEAN NOT NULL,
			meta JSON NOT NULL
		);`,
		).run();

		// Create uploads table
		database.prepare(
			`CREATE TABLE IF NOT EXISTS uploads (
			_id INTEGER PRIMARY KEY AUTOINCREMENT,
			uid TEXT NOT NULL,
			sid TEXT NOT NULL,
			filename TEXT NOT NULL,
			location TEXT NOT NULL,
			timestamp NUMBER NOT NULL,
			hash TEXT NOT NULL,
			type TEXT NOT NULL,
			size NUMBER NOT NULL,
			uploader_uid TEXT NOT NULL
		);`,
		).run();

		log.info(`using sqlite ${version}`);
		return;
	},

	putUpload: (image: Upload) =>
		database.prepare(`
			INSERT INTO uploads (uid, sid, filename, location, timestamp, hash, type, size, uploader_uid)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`).run(
			image.uid,
			image.sid,
			image.filename,
			image.location,
			image.timestamp,
			image.hash,
			image.type,
			image.size,
			image.uploader_uid,
		),

	getUpload: (needle: string) =>
		database.prepare(`SELECT * FROM uploads WHERE uid = ? OR sid = ?;`).get<Upload>(needle, needle),

	getUploads: (needle: string) =>
		database.prepare(`SELECT * FROM uploads WHERE uploader_uid = ? OR filehash = ?;`).all<Upload>(needle, needle),

	createUser: (user: User) =>
		database.prepare(`
			INSERT INTO users (uid, name, username, passhash, owner, meta)
			VALUES (?, ?, ?, ?, ?, ?);`).run(
			user.uid,
			user.name,
			user.username,
			user.passhash,
			user.owner,
			user.meta,
		),

	getUser: (needle: string) =>
		database.prepare(`SELECT * FROM users WHERE uid = ? OR username = ?;`).get<User>(needle, needle),

	debug: () => {
		log.debug('database details');
		console.debug(`------------ users ------------`);
		console.debug(database.prepare(`PRAGMA table_info(users);`).all());
		console.debug(`------------ uploads ------------`);
		console.debug(database.prepare(`PRAGMA table_info(uploads);`).all());
	},
};

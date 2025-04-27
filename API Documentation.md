API Documentation
1. Sign Up User
Endpoint: POST http://localhost:5000/api/auth/signup
Description: This endpoint is used for user registration. It accepts user details like username, email, and password.
Request:
```json
{
    "username": "test",
    "email": "test@example.com",
    "password": "securepassword123"
}```
Response:
Success (201 Created):
```json
{
    "message": "User registered successfully"
}```
Error (400 Bad Request):
```json
{
    "message": "Invalid input"
}```


2. Upload Video
Endpoint: POST http://localhost:5000/api/videos/upload
Description: This endpoint allows the upload of a video file. The video should be provided as form data with the key "video" and the value being the video file (in .mp4 format).
Request:
Form Data:
- video (type: .mp4 file)


3. Trim Video
Endpoint: POST http://localhost:5000/api/videos/{id}/trim
Description: This endpoint is used to trim the video. You can specify the start and end time for the video segment.
Request:
```json
{
  "start": 5,
  "end": 15
}```
- {id}: The unique ID of the video (to be replaced in the URL).


4. Add Subtitles
Endpoint: POST http://localhost:5000/api/videos/{id}/subtitles
Description: This endpoint allows you to add subtitles to the video. You specify the text for the subtitle and the start and end time for when it should appear.
Request:
```json
{
  "text": "This is a subtitle",
  "start": 5,
  "end": 10
}```
- {id}: The unique ID of the video (to be replaced in the URL).


5. Render Video
Endpoint: POST http://localhost:5000/api/videos/{id}/render
Description: This endpoint is used to render the final version of the video after processing operations such as trimming and adding subtitles. This operation does not require a body; simply hitting the endpoint will process the video.
Request:
No request body is required for this endpoint.


6. Download Video
Endpoint: GET http://localhost:5000/api/videos/{id}/download
Description: This endpoint is used to download the final rendered video. It will be triggered by the browser.
Request:
No request body is required for this endpoint.
Response:
Success (200 OK): The browser will initiate a download of the rendered video file.

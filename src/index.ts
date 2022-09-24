import { Router } from 'itty-router'
import Database, { User } from './models/Database'

// now let's create a router (note the lack of "new")
const router = Router()

router.post('/v1/register', async (request: Request) => {
  try {
    const userInput: User = await request.json()
    await Database.register(userInput)
    return new Response(JSON.stringify({ ok: true, data: userInput }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      }
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : String(error) }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      }
    })
  }
})

router.post('/v1/login', async (request: Request) => {
  try {
    const userInput: User = await request.json()
    const sessionId = await Database.login(userInput.login, userInput.password)
    return new Response(JSON.stringify({ ok: true, data: { sessionId: sessionId } }), {
      headers: {
        'Set-Cookie': "sessionId=" + sessionId + "; SameSite=None; Secure",
      }
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : String(error) }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      }
    })
  }
})

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }))

function handleOptions(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check or reject the requested method + headers
    // you can do that here.
    let respHeaders = {
      ...corsHeaders,
      // Allow all future content Request headers to go back to browser
      // such as Authorization (Bearer) or X-Client-Name-Version
      'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '',
    };

    return new Response(null, {
      headers: respHeaders,
    });
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS',
      },
    });
  }
}

addEventListener('fetch', event => {
  const request = event.request;
  if (request.method === 'OPTIONS') {
    event.respondWith(handleOptions(request));
  } else if (['GET', 'HEAD', 'POST'].includes(request.method)) {
    event.respondWith(
      router.handle(request).then((res: Response) => {
        const url = new URL(request.url)
        res.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
        res.headers.set('Access-Control-Allow-Methods', "GET,HEAD,POST,OPTIONS")
        res.headers.set('Access-Control-Max-Age', "86400")
        return res
      })
    )
  } else {
    event.respondWith(
      new Response(null, {
        status: 405,
        statusText: 'Method Not Allowed',
      })
    );
  }
})
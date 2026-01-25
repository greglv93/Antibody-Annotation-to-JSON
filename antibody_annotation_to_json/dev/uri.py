from urllib.parse import quote, unquote, urldefrag

# From RFC 3986, most regex characters are either unreserved or allowed within URI fragments
# But some problematic characters (which cause URI parsing errors when present) include:
# "|", "^", "[", "]"
# This module provides a function for percent-encoding these characters to their hexadecimal form (%XX),
# specifically within the 'target' property of JSON schema unit tests for properties with regex patterns


# This is a set of characters that are 'safe' within the URI fragment for our purposes,
# so they can be kept for maximum readability
FRAGMENT_SAFE = "/?:@!$&'()*+,;=~-._"


def fix_uri(target: str) -> str:
    """
    Make a sourcemeta test 'target' string URI-safe by percent-encoding disallowed
    characters in the fragment part (after '#').

    Idempotent: running it repeatedly won't keep re-encoding.
    """
    base, frag = urldefrag(target)  # frag is returned WITHOUT the leading '#'
    if not frag:
        return target

    # Normalize: decode any existing %XX (avoids double-encoding)
    frag_decoded = unquote(frag)
    # Re-encode only what isn't allowed in a fragment
    frag_encoded = quote(frag_decoded, safe=FRAGMENT_SAFE)

    return f"{base}#{frag_encoded}"

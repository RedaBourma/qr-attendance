# from django.shortcuts import render
from django.shortcuts import redirect

# Create your views here.
def home_redirect(request):
    # return render()
    return redirect("http://localhost:3000/login")
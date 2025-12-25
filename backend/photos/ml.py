import torch
from torchvision import models,transforms
from PIL import Image
import json
import os

model=models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
model.eval()

preprocess=transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485,0.456,0.406],
        std=[0.229,0.224,0.225],
    ),
])

LABELS_PATH=os.path.join(os.path.dirname(__file__),"imagenet_classes.json")

with open(LABELS_PATH) as f:
    IMAGENET_LABELS=json.load(f)


def run_image_classifier(image_path):
    top_k=5
    image=Image.open(image_path).convert("RGB")
    input_tensor=preprocess(image)
    input_batch=input_tensor.unsqueeze(0)
    with torch.no_grad():
        outputs=model(input_batch)
        probabilities=torch.nn.functional.softmax(outputs[0],dim=0)
    top_probs,top_idxs=probabilities.topk(top_k)
    results=[]
    for prob,idx in zip(top_probs, top_idxs):
        label=IMAGENET_LABELS[idx.item()]
        confidence=round(prob.item(),4)
        results.append((label, confidence))

    return results
